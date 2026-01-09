import { z } from 'zod';
export const sendMessageSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
  senderId: z.string().min(1, 'Sender ID is required'),
  content: z.string().min(1, 'Message content is required').max(5000, 'Message too long'),
  messageType: z.enum(['text', 'image', 'file']).default('text').optional(),
});

export const getMessagesSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
  limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
  skip: z.coerce.number().int().min(0).default(0).optional(),
});

export const markAsReadSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
  userId: z.string().min(1, 'User ID is required'),
});

export const typingIndicatorSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  isTyping: z.boolean(),
});

export const joinConversationSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type GetMessagesInput = z.infer<typeof getMessagesSchema>;
export type MarkAsReadInput = z.infer<typeof markAsReadSchema>;
export type TypingIndicatorInput = z.infer<typeof typingIndicatorSchema>;
export type JoinConversationInput = z.infer<typeof joinConversationSchema>;

