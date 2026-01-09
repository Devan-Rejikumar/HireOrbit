/**
 * useWebRTC Hook
 * Manages WebRTC peer connection lifecycle, signaling, and media streams
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { WebRTCSignalingClient } from '@/services/WebRTCSignalingClient';
import { createPeerConnection, getUserMedia, stopMediaStream, getConnectionStateDescription } from '@/utils/webrtcUtils';
import { WebRTCConfig, PeerInfo, OfferData, AnswerData, IceCandidateData } from '@/types/webrtc.types';

interface UseWebRTCOptions {
  config: WebRTCConfig;
  userId: string;
  role: 'company' | 'jobseeker';
  enabled?: boolean;
}

interface UseWebRTCReturn {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connectionState: RTCPeerConnectionState;
  connectionStateDescription: string;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  peerInfo: PeerInfo | null;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  toggleAudio: () => void;
  toggleVideo: () => void;
  endCall: () => void;
}

export function useWebRTC({
  config,
  userId,
  role,
  enabled = true,
}: UseWebRTCOptions): UseWebRTCReturn {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [peerInfo, setPeerInfo] = useState<PeerInfo | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const signalingClientRef = useRef<WebRTCSignalingClient | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remotePeerIdRef = useRef<string | null>(null);
  const isInitiatorRef = useRef<boolean>(false);
  const iceCandidateQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const remoteDescriptionSetRef = useRef<boolean>(false);

  // Initialize WebRTC connection
  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (!config) {
      setError('WebRTC configuration is missing');
      return;
    }

    if (!userId) {
      setError('User ID is missing');
      return;
    }

    let isMounted = true;

    const initializeWebRTC = async () => {
      try {
        setIsConnecting(true);
        setError(null);

        // Get user media
        const stream = await getUserMedia(true, true);
        if (!isMounted) {
          stopMediaStream(stream);
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsAudioEnabled(true);
        setIsVideoEnabled(true);

        // Create peer connection
        const peerConnection = createPeerConnection(config.iceServers);
        peerConnectionRef.current = peerConnection;

        // Add local stream tracks to peer connection
        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream);
        });

        // Handle remote stream
        peerConnection.ontrack = (event: RTCTrackEvent) => {
          if (event.streams && event.streams[0]) {
            setRemoteStream(event.streams[0]);
          }
        };

        // Handle connection state changes
        peerConnection.onconnectionstatechange = () => {
          const state = peerConnection.connectionState;
          setConnectionState(state);
          setIsConnected(state === 'connected');
          setIsConnecting(state === 'connecting' || state === 'new');

          if (state === 'connected') {
            setError(null);
          } else if (state === 'failed' || state === 'disconnected') {
            setError('Connection lost. Please try again.');
          }
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
          if (event.candidate && remotePeerIdRef.current && signalingClientRef.current) {
            signalingClientRef.current.sendIceCandidate(
              event.candidate.toJSON(),
              remotePeerIdRef.current,
            );
          }
        };

        // Create signaling client
        const signalingClient = new WebRTCSignalingClient(
          config.signalingServerUrl,
          config.interviewId,
          userId,
          role,
        );
        signalingClientRef.current = signalingClient;

        // Connect to signaling server
        try {
          await signalingClient.connect();
        } catch (connectError) {
          throw connectError;
        }

        // Handle peer joined
        signalingClient.onPeerJoined((peer: PeerInfo) => {
          if (!isMounted) {
            return;
          }
          setPeerInfo(peer);
          remotePeerIdRef.current = peer.userId;

          // Determine who initiates (company initiates, jobseeker receives)
          isInitiatorRef.current = role === 'company';

          if (isInitiatorRef.current && peerConnection) {
            // Company creates offer
            createOffer(peerConnection, peer.userId, signalingClient);
          }
        });

        // Handle incoming offer
        signalingClient.onOffer(async (data: OfferData) => {
          if (!peerConnection || !isMounted) {
            return;
          }

          try {
            await peerConnection.setRemoteDescription(
              new RTCSessionDescription({
                type: data.offer.type,
                sdp: data.offer.sdp,
              }),
            );
            remoteDescriptionSetRef.current = true;

            // Process any queued ICE candidates
            await processQueuedIceCandidates();

            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            // Convert RTCSessionDescription to JSON format
            const answerData: RTCSessionDescriptionInit = {
              type: answer.type,
              sdp: answer.sdp || '',
            };
            signalingClient.sendAnswer(answerData, data.fromUserId);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to handle offer');
          }
        });

        // Handle incoming answer
        signalingClient.onAnswer(async (data: AnswerData) => {
          if (!peerConnection || !isMounted) {
            return;
          }

          try {
            await peerConnection.setRemoteDescription(
              new RTCSessionDescription({
                type: data.answer.type,
                sdp: data.answer.sdp,
              }),
            );
            remoteDescriptionSetRef.current = true;

            // Process any queued ICE candidates
            await processQueuedIceCandidates();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to handle answer');
          }
        });

        // Process queued ICE candidates after remote description is set
        const processQueuedIceCandidates = async () => {
          if (remoteDescriptionSetRef.current && iceCandidateQueueRef.current.length > 0 && peerConnection) {
            for (const candidateData of iceCandidateQueueRef.current) {
              try {
                await peerConnection.addIceCandidate(
                  new RTCIceCandidate(candidateData),
                );
              } catch (err) {
                // Silently handle ICE candidate errors
              }
            }
            iceCandidateQueueRef.current = []; // Clear queue
          }
        };

        // Handle incoming ICE candidate
        // Queue ICE candidates until remote description is set
        signalingClient.onIceCandidate(async (data: IceCandidateData) => {
          if (!peerConnection || !isMounted) return;

          const candidateData: RTCIceCandidateInit = {
            candidate: data.candidate.candidate,
            sdpMLineIndex: data.candidate.sdpMLineIndex ?? undefined,
            sdpMid: data.candidate.sdpMid ?? undefined,
          };

          try {
            if (remoteDescriptionSetRef.current) {
              // Remote description is set, add candidate immediately
              await peerConnection.addIceCandidate(new RTCIceCandidate(candidateData));
            } else {
              // Queue candidate until remote description is set
              iceCandidateQueueRef.current.push(candidateData);
            }
          } catch (err) {
            // Silently handle ICE candidate errors
          }
        });

        // Handle peer left
        signalingClient.onPeerLeft(() => {
          if (isMounted) {
            setPeerInfo(null);
            setRemoteStream(null);
            setError('Peer disconnected');
          }
        });

      } catch (err) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to initialize WebRTC';
          setError(errorMessage);
          setIsConnecting(false);
        }
      }
    };

    initializeWebRTC();

    return () => {
      isMounted = false;
      cleanup();
    };
  }, [enabled, config, userId, role]);

  // Create offer helper
  const createOffer = async (
    peerConnection: RTCPeerConnection,
    toUserId: string,
    signalingClient: WebRTCSignalingClient,
  ) => {
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      // Convert RTCSessionDescription to JSON format
      const offerData: RTCSessionDescriptionInit = {
        type: offer.type,
        sdp: offer.sdp || '',
      };
      signalingClient.sendOffer(offerData, toUserId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create offer');
    }
  };

  // Cleanup function
  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      stopMediaStream(localStreamRef.current);
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (signalingClientRef.current) {
      signalingClientRef.current.disconnect();
      signalingClientRef.current = null;
    }
    // Reset refs
    iceCandidateQueueRef.current = [];
    remoteDescriptionSetRef.current = false;
    remotePeerIdRef.current = null;
    isInitiatorRef.current = false;
    
    setLocalStream(null);
    setRemoteStream(null);
    setPeerInfo(null);
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioEnabled(prev => !prev);
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(prev => !prev);
    }
  }, []);

  // End call
  const endCall = useCallback(() => {
    cleanup();
  }, [cleanup]);

  return {
    localStream,
    remoteStream,
    connectionState,
    connectionStateDescription: getConnectionStateDescription(connectionState),
    isConnected,
    isConnecting,
    error,
    peerInfo,
    isAudioEnabled,
    isVideoEnabled,
    toggleAudio,
    toggleVideo,
    endCall,
  };
}

