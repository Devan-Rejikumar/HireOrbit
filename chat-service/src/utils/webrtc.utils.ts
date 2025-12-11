/**
 * WebRTC Utility Functions
 * Helper functions for WebRTC room management
 */

import { 
  WebRTCRoom, 
  SerializableWebRTCRoom,
  WebRTCParticipant,
  SerializableWebRTCParticipant
} from '../types/webrtc.types';

/**
 * Convert WebRTCRoom to serializable format for Socket.IO emission
 */
export function serializeRoom(room: WebRTCRoom): SerializableWebRTCRoom {
  const participants: Record<string, SerializableWebRTCParticipant> = {};
  
  room.participants.forEach((participant, socketId) => {
    participants[socketId] = {
      userId: participant.userId,
      socketId: participant.socketId,
      role: participant.role,
      joinedAt: participant.joinedAt.toISOString()
    };
  });

  return {
    interviewId: room.interviewId,
    roomId: room.roomId,
    participants,
    createdAt: room.createdAt.toISOString()
  };
}

/**
 * Convert participant to serializable format
 */
export function serializeParticipant(
  participant: WebRTCParticipant
): SerializableWebRTCParticipant {
  return {
    userId: participant.userId,
    socketId: participant.socketId,
    role: participant.role,
    joinedAt: participant.joinedAt.toISOString()
  };
}