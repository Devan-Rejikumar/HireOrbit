import { Router } from 'express';
import { container } from '../config/inversify.config';
import { ChatController } from '../controllers/ChatController';
import { TYPES } from '../config/types';

const router = Router();
// Get ChatController directly from container (following project pattern)
const chatController = container.get<ChatController>(TYPES.ChatController);

router.get('/users/:userId/conversations', (req, res) => chatController.getUserConversations(req, res));
router.get('/companies/:companyId/conversations', (req, res) => chatController.getCompanyConversations(req, res));
router.get('/conversations/:conversationId', (req, res) => chatController.getConversation(req, res));
router.get('/conversations/application/:applicationId', (req, res) => chatController.getConversationByApplication(req, res));
router.get('/conversations/:conversationId/messages', (req, res) => chatController.getMessages(req, res));
router.post('/conversations/:conversationId/read', (req, res) => chatController.markAsRead(req, res));
router.get('/conversations/:conversationId/unread-count', (req, res) =>  chatController.getUnreadCount(req, res));
router.get('/users/:userId/total-unread-count', (req, res) => chatController.getTotalUnreadCount(req, res));
router.get('/users/:userId/conversations-with-unread', (req, res) => chatController.getConversationsWithUnread(req, res));

export default router;