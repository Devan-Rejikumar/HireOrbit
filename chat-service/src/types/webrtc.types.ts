/**
 * WebRTC Signaling Types
 * TypeScript interfaces for WebRTC signaling
 */

export type WebRTCRole = 'company' | 'jobseeker';

export interface SessionDescription {
  type: 'offer' | 'answer';
  sdp: string;
}

export interface IceCandidate {
  candidate: string;
  sdpMLineIndex: number | null;
  sdpMid: string | null;
}

export interface WebRTCParticipant {
  userId: string;
  socketId: string;
  role: WebRTCRole;
  joinedAt: Date;
}

export interface SerializableWebRTCParticipant {
  userId: string;
  socketId: string;
  role: WebRTCRole;
  joinedAt: string; 
}

export interface WebRTCRoom {
  interviewId: string;
  roomId?: string;
  participants: Map<string, WebRTCParticipant>;
  createdAt: Date;
}

export interface SerializableWebRTCRoom {
  interviewId: string;
  roomId?: string;
  participants: Record<string, SerializableWebRTCParticipant>;
  createdAt: string;
}

export interface JoinRoomData {
  interviewId: string;
  userId: string;
  role: WebRTCRole;
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

export interface UserLeftData {
  interviewId: string;
  userId: string;
}

export interface WebRTCErrorData {
  interviewId: string;
  error: string;
  message?: string;
}