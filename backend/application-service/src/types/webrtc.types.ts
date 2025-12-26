/**
 * WebRTC Types for Application Service
 * Type definitions for WebRTC configuration and related interfaces
 */

/**
 * ICE Server configuration for WebRTC
 * STUN servers only need urls, TURN servers also need username and credential
 */
export interface RTCIceServer {
  urls: string;
  username?: string;
  credential?: string;
}

/**
 * WebRTC Configuration Response
 * Contains all necessary information for frontend to establish WebRTC connection
 */
export interface WebRTCConfigResponse {
  interviewId: string;
  roomId: string;
  signalingServerUrl: string;
  iceServers: RTCIceServer[];
}