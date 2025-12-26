/**
 * WebRTC Event Names
 * Enum for WebRTC signaling event names
 */

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