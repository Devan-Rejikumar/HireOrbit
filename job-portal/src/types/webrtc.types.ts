/**
 * WebRTC Types for Frontend
 * Type definitions for WebRTC configuration and signaling
 */

export interface RTCIceServer {
  urls: string;
  username?: string;
  credential?: string;
}

export interface WebRTCConfig {
  interviewId: string;
  roomId: string;
  signalingServerUrl: string;
  iceServers: RTCIceServer[];
}

export interface WebRTCConfigResponse {
  success: boolean;
  data: WebRTCConfig;
  message: string;
}

export type WebRTCRole = 'company' | 'jobseeker';

export interface JoinRoomData {
  interviewId: string;
  userId: string;
  role: WebRTCRole;
}

export interface SessionDescription {
  type: 'offer' | 'answer';
  sdp: string;
}

export interface IceCandidate {
  candidate: string;
  sdpMLineIndex: number | null;
  sdpMid: string | null;
}

export interface OfferData {
  interviewId: string;
  offer: SessionDescription;
  fromUserId: string;
  toUserId: string;
}

export interface AnswerData {
  interviewId: string;
  answer: SessionDescription;
  fromUserId: string;
  toUserId: string;
}

export interface IceCandidateData {
  interviewId: string;
  candidate: IceCandidate;
  fromUserId: string;
  toUserId: string;
}

export interface PeerInfo {
  userId: string;
  role: WebRTCRole;
}

export enum WebRTCEvent {
  JOIN_ROOM = 'webrtc-join-room',
  ROOM_JOINED = 'webrtc-room-joined',
  PEER_JOINED = 'webrtc-peer-joined',
  OFFER = 'webrtc-offer',
  ANSWER = 'webrtc-answer',
  ICE_CANDIDATE = 'webrtc-ice-candidate',
  USER_LEFT = 'webrtc-user-left',
  ROOM_CLOSED = 'webrtc-room-closed',
  ERROR = 'webrtc-error'
}

