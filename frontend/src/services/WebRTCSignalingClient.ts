/**
 * WebRTC Signaling Client
 * Manages WebSocket connection for WebRTC signaling
 */

import { io, Socket } from 'socket.io-client';
import {
  WebRTCEvent,
  JoinRoomData,
  OfferData,
  AnswerData,
  IceCandidateData,
  PeerInfo,
} from '@/types/webrtc.types';

export class WebRTCSignalingClient {
  private socket: Socket | null = null;
  private signalingServerUrl: string;
  private interviewId: string;
  private userId: string;
  private role: 'company' | 'jobseeker';

  constructor(
    signalingServerUrl: string,
    interviewId: string,
    userId: string,
    role: 'company' | 'jobseeker',
  ) {
    this.signalingServerUrl = signalingServerUrl;
    this.interviewId = interviewId;
    this.userId = userId;
    this.role = role;
  }

  /**
   * Connect to signaling server and join room
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Validate URL format
        if (!this.signalingServerUrl) {
          reject(new Error('Signaling server URL is not configured'));
          return;
        }

        // Ensure URL doesn't have trailing slash for Socket.IO
        const cleanUrl = this.signalingServerUrl.replace(/\/$/, '');
        
        this.socket = io(cleanUrl, {
          transports: ['websocket', 'polling'], // Allow fallback to polling
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 10000,
        });

        let connectionTimeout: NodeJS.Timeout | null = null;
        let roomJoinTimeout: NodeJS.Timeout | null = null;

        const cleanup = () => {
          if (connectionTimeout) {
            clearTimeout(connectionTimeout);
            connectionTimeout = null;
          }
          if (roomJoinTimeout) {
            clearTimeout(roomJoinTimeout);
            roomJoinTimeout = null;
          }
        };

        // Set timeout for ROOM_JOINED response
        const startRoomJoinTimeout = () => {
          clearRoomJoinTimeout(); // Clear any existing timeout
          roomJoinTimeout = setTimeout(() => {
            cleanup();
            reject(new Error('Timeout: Server did not respond to JOIN_ROOM request. Please check if the chat service is running and receiving events.'));
          }, 10000); // 10 seconds to receive ROOM_JOINED
        };
        
        const clearRoomJoinTimeout = () => {
          if (roomJoinTimeout) {
            clearTimeout(roomJoinTimeout);
            roomJoinTimeout = null;
          }
        };

        // Set connection timeout
        connectionTimeout = setTimeout(() => {
          cleanup();
          if (!this.socket?.connected) {
            this.socket?.disconnect();
            reject(new Error(`Connection timeout: Unable to connect to signaling server at ${cleanUrl}. Please ensure the chat service is running on port 4007.`));
          }
        }, 15000);

        this.socket.on('connect', () => {
          cleanup();
          
          // Join the room
          const joinData: JoinRoomData = {
            interviewId: this.interviewId,
            userId: this.userId,
            role: this.role,
          };
          
          startRoomJoinTimeout(); // Start timeout for ROOM_JOINED response
          this.socket?.emit(WebRTCEvent.JOIN_ROOM, joinData);
        });

        interface RoomData {
          participants?: string[];
          [key: string]: unknown;
        }
        this.socket.on(WebRTCEvent.ROOM_JOINED, () => {
          clearRoomJoinTimeout();
          cleanup();
          resolve();
        });

        this.socket.on(WebRTCEvent.ERROR, (error: { error: string; message?: string }) => {
          cleanup();
          reject(new Error(error.message || error.error || 'Unknown signaling error'));
        });

        this.socket.on('connect_error', () => {
          // Don't reject immediately - let reconnection attempts happen
          // Only reject if all reconnection attempts fail
        });

        this.socket.on('disconnect', (reason: string) => {
          if (reason === 'io server disconnect') {
            // Server disconnected, reject immediately
            cleanup();
            reject(new Error('Server disconnected the connection'));
          }
        });

        // Handle reconnection failure
        this.socket.io.on('reconnect_failed', () => {
          cleanup();
          reject(new Error(`Failed to connect to signaling server at ${cleanUrl}. Please check:\n1. Chat service is running on port 4007\n2. No firewall blocking the connection\n3. Correct URL in configuration`));
        });

      } catch (error) {
        reject(error instanceof Error ? error : new Error('Unknown error'));
      }
    });
  }

  /**
   * Disconnect from signaling server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.emit(WebRTCEvent.USER_LEFT, {
        interviewId: this.interviewId,
        userId: this.userId,
      });
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Register callback for when peer joins
   */
  onPeerJoined(callback: (peer: PeerInfo) => void): void {
    this.socket?.on(WebRTCEvent.PEER_JOINED, (data: { interviewId: string; peer: PeerInfo }) => {
      if (data.interviewId === this.interviewId) {
        callback(data.peer);
      }
    });
  }

  /**
   * Register callback for receiving offer
   */
  onOffer(callback: (data: OfferData) => void): void {
    this.socket?.on(WebRTCEvent.OFFER, (data: OfferData) => {
      if (data.interviewId === this.interviewId && data.toUserId === this.userId) {
        callback(data);
      }
    });
  }

  /**
   * Register callback for receiving answer
   */
  onAnswer(callback: (data: AnswerData) => void): void {
    this.socket?.on(WebRTCEvent.ANSWER, (data: AnswerData) => {
      if (data.interviewId === this.interviewId && data.toUserId === this.userId) {
        callback(data);
      }
    });
  }

  /**
   * Register callback for receiving ICE candidate
   */
  onIceCandidate(callback: (data: IceCandidateData) => void): void {
    this.socket?.on(WebRTCEvent.ICE_CANDIDATE, (data: IceCandidateData) => {
      if (data.interviewId === this.interviewId && data.toUserId === this.userId) {
        callback(data);
      }
    });
  }

  /**
   * Register callback for when peer leaves
   */
  onPeerLeft(callback: (userId: string) => void): void {
    this.socket?.on(WebRTCEvent.USER_LEFT, (data: { interviewId: string; userId: string }) => {
      if (data.interviewId === this.interviewId && data.userId !== this.userId) {
        callback(data.userId);
      }
    });
  }

  /**
   * Send offer to peer
   */
  sendOffer(offer: RTCSessionDescriptionInit, toUserId: string): void {
    const offerData: OfferData = {
      interviewId: this.interviewId,
      offer: {
        type: offer.type as 'offer' | 'answer',
        sdp: offer.sdp || '',
      },
      fromUserId: this.userId,
      toUserId,
    };
    this.socket?.emit(WebRTCEvent.OFFER, offerData);
  }

  /**
   * Send answer to peer
   */
  sendAnswer(answer: RTCSessionDescriptionInit, toUserId: string): void {
    const answerData: AnswerData = {
      interviewId: this.interviewId,
      answer: {
        type: answer.type as 'offer' | 'answer',
        sdp: answer.sdp || '',
      },
      fromUserId: this.userId,
      toUserId,
    };
    this.socket?.emit(WebRTCEvent.ANSWER, answerData);
  }

  /**
   * Send ICE candidate to peer
   */
  sendIceCandidate(candidate: RTCIceCandidateInit, toUserId: string): void {
    const candidateData: IceCandidateData = {
      interviewId: this.interviewId,
      candidate: {
        candidate: candidate.candidate || '',
        sdpMLineIndex: candidate.sdpMLineIndex ?? null,
        sdpMid: candidate.sdpMid ?? null,
      },
      fromUserId: this.userId,
      toUserId,
    };
    this.socket?.emit(WebRTCEvent.ICE_CANDIDATE, candidateData);
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

