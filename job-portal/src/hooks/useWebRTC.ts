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
  console.log('🚀 useWebRTC Hook: Called with', { config, userId, role, enabled });

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
  const isInitializingRef = useRef<boolean>(false);

  // Initialize WebRTC connection
  useEffect(() => {
    console.log('🔄 useWebRTC useEffect: Running', { enabled, config: !!config, userId, role });
    
    if (!enabled) {
      console.log('⚠️ useWebRTC: Disabled, skipping initialization');
      return;
    }

    if (!config) {
      console.error('❌ useWebRTC: Config is missing!');
      setError('WebRTC configuration is missing');
      return;
    }

    if (!userId) {
      console.error('❌ useWebRTC: User ID is missing!');
      setError('User ID is missing');
      return;
    }

    // Prevent multiple simultaneous initializations
    if (isInitializingRef.current) {
      console.warn('⚠️ useWebRTC: Initialization already in progress, skipping duplicate call');
      return;
    }

    let isMounted = true;

    const initializeWebRTC = async () => {
      isInitializingRef.current = true;
      console.log('🎬 initializeWebRTC: Starting initialization...');
      try {
        setIsConnecting(true);
        setError(null);

        console.log('📹 Requesting user media (camera + microphone)...');
        // Get user media
        const stream = await getUserMedia(true, true);
        console.log('✅ User media obtained:', {
          audioTracks: stream.getAudioTracks().length,
          videoTracks: stream.getVideoTracks().length,
        });
        if (!isMounted) {
          stopMediaStream(stream);
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsAudioEnabled(true);
        setIsVideoEnabled(true);

        // Create peer connection
        console.log('🔗 Creating peer connection with ICE servers:', config.iceServers);
        const peerConnection = createPeerConnection(config.iceServers);
        peerConnectionRef.current = peerConnection;
        console.log('✅ Peer connection created');

        // Add local stream tracks to peer connection
        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream);
        });

        // Handle remote stream
        peerConnection.ontrack = (event: RTCTrackEvent) => {
          console.log('🎥 Remote track received:', event.track.kind);
          if (event.streams && event.streams[0]) {
            console.log('🎥 Setting remote stream with', event.streams[0].getTracks().length, 'tracks');
            setRemoteStream(event.streams[0]);
          }
        };

        // Handle connection state changes
        peerConnection.onconnectionstatechange = () => {
          const state = peerConnection.connectionState;
          console.log('🔌 Connection state changed:', state);
          setConnectionState(state);
          setIsConnected(state === 'connected');
          setIsConnecting(state === 'connecting' || state === 'new');

          if (state === 'connected') {
            console.log('✅ WebRTC connection established!');
            setError(null);
          } else if (state === 'failed' || state === 'disconnected') {
            console.error('❌ Connection failed or disconnected:', state);
            setError('Connection lost. Please try again.');
          }
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
          if (event.candidate && remotePeerIdRef.current && signalingClientRef.current) {
            console.log('🔷 ICE candidate generated, sending to:', remotePeerIdRef.current);
            signalingClientRef.current.sendIceCandidate(
              event.candidate.toJSON(),
              remotePeerIdRef.current,
            );
          } else if (event.candidate === null) {
            console.log('🔷 ICE gathering complete');
          }
        };

        // Create signaling client
        console.log('📡 Creating signaling client:', {
          signalingServerUrl: config.signalingServerUrl,
          interviewId: config.interviewId,
          userId,
          role,
        });
        const signalingClient = new WebRTCSignalingClient(
          config.signalingServerUrl,
          config.interviewId,
          userId,
          role,
        );
        signalingClientRef.current = signalingClient;

        // Connect to signaling server
        console.log('📡 Connecting to signaling server...');
        try {
          await signalingClient.connect();
          console.log('✅ Connected to signaling server and joined room');
        } catch (connectError) {
          console.error('❌ Failed to connect to signaling server:', connectError);
          throw connectError;
        }

        // Handle peer joined
        signalingClient.onPeerJoined((peer: PeerInfo) => {
          console.log('🔵 Peer joined event received:', peer);
          if (!isMounted) {
            console.log('🔵 Component unmounted, ignoring peer joined');
            return;
          }
          setPeerInfo(peer);
          remotePeerIdRef.current = peer.userId;

          // Determine who initiates (company initiates, jobseeker receives)
          isInitiatorRef.current = role === 'company';
          console.log(`🔵 Is initiator: ${isInitiatorRef.current}, Role: ${role}, Peer: ${peer.userId}`);

          if (isInitiatorRef.current && peerConnection) {
            // Company creates offer
            console.log('🔵 Creating offer...');
            createOffer(peerConnection, peer.userId, signalingClient);
          } else {
            console.log('🔵 Waiting for offer from peer (not initiator)');
          }
        });

        // Handle incoming offer
        signalingClient.onOffer(async (data: OfferData) => {
          console.log('🟢 Offer received from:', data.fromUserId);
          if (!peerConnection || !isMounted) {
            console.log('🟢 Peer connection or component not ready, ignoring offer');
            return;
          }

          try {
            console.log('🟢 Setting remote description...');
            await peerConnection.setRemoteDescription(
              new RTCSessionDescription({
                type: data.offer.type,
                sdp: data.offer.sdp,
              }),
            );
            remoteDescriptionSetRef.current = true;
            console.log('🟢 Remote description set');

            // Process any queued ICE candidates
            await processQueuedIceCandidates();

            console.log('🟢 Creating answer...');
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            console.log('🟢 Sending answer to:', data.fromUserId);
            // Convert RTCSessionDescription to JSON format
            const answerData: RTCSessionDescriptionInit = {
              type: answer.type,
              sdp: answer.sdp || '',
            };
            signalingClient.sendAnswer(answerData, data.fromUserId);
          } catch (err) {
            console.error('❌ Error handling offer:', err);
            setError(err instanceof Error ? err.message : 'Failed to handle offer');
          }
        });

        // Handle incoming answer
        signalingClient.onAnswer(async (data: AnswerData) => {
          console.log('🟡 Answer received from:', data.fromUserId);
          if (!peerConnection || !isMounted) {
            console.log('🟡 Peer connection or component not ready, ignoring answer');
            return;
          }

          try {
            console.log('🟡 Setting remote description from answer...');
            await peerConnection.setRemoteDescription(
              new RTCSessionDescription({
                type: data.answer.type,
                sdp: data.answer.sdp,
              }),
            );
            remoteDescriptionSetRef.current = true;
            console.log('🟡 Remote description set from answer');

            // Process any queued ICE candidates
            await processQueuedIceCandidates();

            console.log('🟡 Answer processed successfully');
          } catch (err) {
            console.error('❌ Error handling answer:', err);
            setError(err instanceof Error ? err.message : 'Failed to handle answer');
          }
        });

        // Process queued ICE candidates after remote description is set
        const processQueuedIceCandidates = async () => {
          if (remoteDescriptionSetRef.current && iceCandidateQueueRef.current.length > 0 && peerConnection) {
            console.log(`🔷 Processing ${iceCandidateQueueRef.current.length} queued ICE candidates`);
            for (const candidateData of iceCandidateQueueRef.current) {
              try {
                await peerConnection.addIceCandidate(
                  new RTCIceCandidate(candidateData),
                );
                console.log('🔷 Queued ICE candidate added');
              } catch (err) {
                console.error('❌ Error adding queued ICE candidate:', err);
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
              console.log('🔷 ICE candidate added');
            } else {
              // Queue candidate until remote description is set
              iceCandidateQueueRef.current.push(candidateData);
              console.log('🔷 ICE candidate queued (waiting for remote description)');
            }
          } catch (err) {
            console.error('❌ Error adding ICE candidate:', err);
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
        console.error('❌ initializeWebRTC: Error occurred', err);
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to initialize WebRTC';
          console.error('❌ Setting error:', errorMessage);
          setError(errorMessage);
          setIsConnecting(false);
        }
      } finally {
        isInitializingRef.current = false;
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
      console.log('🟠 Creating offer for:', toUserId);
      const offer = await peerConnection.createOffer();
      console.log('🟠 Offer created, setting local description...');
      await peerConnection.setLocalDescription(offer);
      console.log('🟠 Sending offer to:', toUserId);
      // Convert RTCSessionDescription to JSON format
      const offerData: RTCSessionDescriptionInit = {
        type: offer.type,
        sdp: offer.sdp || '',
      };
      signalingClient.sendOffer(offerData, toUserId);
      console.log('🟠 Offer sent successfully');
    } catch (err) {
      console.error('❌ Error creating offer:', err);
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
    isInitializingRef.current = false;
    
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

