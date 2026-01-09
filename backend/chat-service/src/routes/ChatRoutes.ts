import { Router } from 'express';
import { container } from '../config/inversify.config';
import { ChatController } from '../controllers/ChatController';
import { TYPES } from '../config/types';
import { CHAT_ROUTES } from '../constants/routes';

const router = Router();
const chatController = container.get<ChatController>(TYPES.ChatController);

router.get(CHAT_ROUTES.GET_USER_CONVERSATIONS, (req, res) => chatController.getUserConversations(req, res));
router.get(CHAT_ROUTES.GET_COMPANY_CONVERSATIONS, (req, res) => chatController.getCompanyConversations(req, res));
router.get(CHAT_ROUTES.GET_CONVERSATION_BY_ID, (req, res) => chatController.getConversation(req, res));
router.get(CHAT_ROUTES.GET_CONVERSATION_BY_APPLICATION, (req, res) => chatController.getConversationByApplication(req, res));
router.get(CHAT_ROUTES.GET_MESSAGES, (req, res) => chatController.getMessages(req, res));
router.post(CHAT_ROUTES.MARK_AS_READ, (req, res) => chatController.markAsRead(req, res));
router.get(CHAT_ROUTES.GET_UNREAD_COUNT, (req, res) => chatController.getUnreadCount(req, res));
router.get(CHAT_ROUTES.GET_USER_TOTAL_UNREAD_COUNT, (req, res) => chatController.getTotalUnreadCount(req, res));
router.get(CHAT_ROUTES.GET_USER_CONVERSATIONS_WITH_UNREAD, (req, res) => chatController.getConversationsWithUnread(req, res));

export default router;