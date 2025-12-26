/**
 * WebRTC Validation Schemas
 * Zod schemas for validating WebRTC signaling events
 */

import { z } from 'zod';

export const sessionDescriptionSchema = z.object({
  type: z.enum(['offer', 'answer']),
  sdp: z.string().min(1, 'SDP cannot be empty'),
});

export const iceCandidateSchema = z.object({
  candidate: z.string().min(1, 'Candidate cannot be empty'),
  sdpMLineIndex: z.number().int().nullable(),
  sdpMid: z.string().nullable(),
});

export const joinRoomSchema = z.object({
  interviewId: z.string().min(1, 'Interview ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(['company', 'jobseeker'], {
    message: 'Role must be either company or jobseeker',
  }),
});

export const offerSchema = z.object({
  interviewId: z.string().min(1, 'Interview ID is required'),
  offer: sessionDescriptionSchema,
  fromUserId: z.string().min(1, 'From user ID is required'),
  toUserId: z.string().min(1, 'To user ID is required'),
});

export const answerSchema = z.object({
  interviewId: z.string().min(1, 'Interview ID is required'),
  answer: sessionDescriptionSchema,
  fromUserId: z.string().min(1, 'From user ID is required'),
  toUserId: z.string().min(1, 'To user ID is required'),
});

export const iceCandidateDataSchema = z.object({
  interviewId: z.string().min(1, 'Interview ID is required'),
  candidate: iceCandidateSchema,
  fromUserId: z.string().min(1, 'From user ID is required'),
  toUserId: z.string().min(1, 'To user ID is required'),
});

export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
export type OfferInput = z.infer<typeof offerSchema>;
export type AnswerInput = z.infer<typeof answerSchema>;
export type IceCandidateInput = z.infer<typeof iceCandidateDataSchema>;