/**
 * WebRTC Utility Functions
 * Helper functions for creating and managing WebRTC peer connections
 */

import { RTCIceServer } from '@/types/webrtc.types';

/**
 * Create RTCPeerConnection with ICE servers configuration
 */
export function createPeerConnection(iceServers: RTCIceServer[]): RTCPeerConnection {
  const configuration: RTCConfiguration = {
    iceServers: iceServers.map(server => ({
      urls: server.urls,
      ...(server.username && { username: server.username }),
      ...(server.credential && { credential: server.credential }),
    })),
  };

  return new RTCPeerConnection(configuration);
}

/**
 * Get user media (camera and microphone)
 * Tries to get media with fallback options if initial request fails
 */
export async function getUserMedia(
  audio: boolean = true,
  video: boolean = true,
): Promise<MediaStream> {
  // Check if getUserMedia is available
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Your browser does not support camera/microphone access. Please use a modern browser.');
  }

  // Enumerate devices to check availability
  let devices: MediaDeviceInfo[] = [];
  let hasAudioInput = false;
  let hasVideoInput = false;
  try {
    devices = await navigator.mediaDevices.enumerateDevices();
    hasAudioInput = devices.some(d => d.kind === 'audioinput');
    hasVideoInput = devices.some(d => d.kind === 'videoinput');
  } catch (enumError) {
    // If enumeration fails, assume devices might be available and proceed
    console.warn('Device enumeration failed, proceeding with requested media:', enumError);
  }

  // Adjust requested media based on available devices
  // If audio is requested but no audio device exists, fall back to video-only
  const actualAudio = audio && hasAudioInput;
  const actualVideo = video && hasVideoInput;

  // First attempt: Try with ideal video constraints (if video requested and available)
  if (actualVideo) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: actualAudio,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });
      return stream;
    } catch (error) {
      console.warn('Failed to get media with ideal constraints, trying with basic video:', error);
      
      // Second attempt: Try with basic video (no constraints)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: actualAudio,
          video: true,
        });
        return stream;
      } catch (error2) {
        console.warn('Failed to get media with basic video, trying fallback options:', error2);
        
        // Third attempt: If audio was requested but failed, try video-only
        if (actualAudio && actualVideo) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: false,
              video: true,
            });
            console.warn('Audio unavailable, continuing with video-only');
            return stream;
          } catch (error3) {
            // If video-only also fails, try audio-only as last resort
            if (actualAudio) {
              try {
                const stream = await navigator.mediaDevices.getUserMedia({
                  audio: true,
                  video: false,
                });
                console.warn('Video unavailable, continuing with audio-only');
                return stream;
              } catch (error4) {
                throw getDetailedMediaError(error4 as DOMException);
              }
            } else {
              throw getDetailedMediaError(error3 as DOMException);
            }
          }
        } else if (actualAudio) {
          // Audio-only request
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: false,
            });
            return stream;
          } catch (error3) {
            throw getDetailedMediaError(error3 as DOMException);
          }
        } else {
          throw getDetailedMediaError(error2 as DOMException);
        }
      }
    }
  } else if (actualAudio) {
    // Audio-only request
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      return stream;
    } catch (error) {
      throw getDetailedMediaError(error as DOMException);
    }
  } else {
    throw new Error('No camera or microphone available. Please connect a device and try again.');
  }
}

/**
 * Get detailed error message based on error type
 */
function getDetailedMediaError(error: DOMException): Error {
  let message = 'Failed to access camera/microphone. ';
  
  switch (error.name) {
  case 'NotFoundError':
  case 'DevicesNotFoundError':
    message += 'No camera or microphone found. Please connect a device and try again.';
    break;
  case 'NotAllowedError':
  case 'PermissionDeniedError':
    message += 'Permission denied. Please allow camera/microphone access in your browser settings and try again.';
    break;
  case 'NotReadableError':
  case 'TrackStartError':
    message += 'Device is already in use by another application. Please close other apps using the camera/microphone and try again.';
    break;
  case 'OverconstrainedError':
  case 'ConstraintNotSatisfiedError':
    message += 'Requested video settings are not supported by your device. Please try again.';
    break;
  case 'AbortError':
    message += 'Request was aborted. Please try again.';
    break;
  case 'TypeError':
    message += 'Invalid constraints provided. Please try again.';
    break;
  default:
    message += `Error: ${error.message || 'Unknown error occurred'}. Please check your device permissions and try again.`;
  }
  
  return new Error(message);
}

/**
 * Stop all tracks in a media stream
 */
export function stopMediaStream(stream: MediaStream | null): void {
  if (stream) {
    stream.getTracks().forEach(track => {
      track.stop();
    });
  }
}

/**
 * Get connection state description
 */
export function getConnectionStateDescription(state: RTCPeerConnectionState): string {
  switch (state) {
  case 'new':
    return 'Initializing...';
  case 'connecting':
    return 'Connecting...';
  case 'connected':
    return 'Connected';
  case 'disconnected':
    return 'Disconnected';
  case 'failed':
    return 'Connection failed';
  case 'closed':
    return 'Connection closed';
  default:
    return 'Unknown';
  }
}

