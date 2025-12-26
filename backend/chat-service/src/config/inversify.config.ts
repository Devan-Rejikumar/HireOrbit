import { Container } from 'inversify';
import { IChatRepository } from '../repositories/interfaces/IChatRepository';
import { ChatRepository } from '../repositories/implementations/ChatRepository';
import { IChatService } from '../services/interfaces/IChatService';
import { ChatService } from '../services/implementations/ChatService';
import { ConversationModel, MessageModel } from '../models/ChatModel';
import { ChatController } from '../controllers/ChatController';
import { TYPES } from './types';

const container = new Container();

container.bind<IChatRepository>(TYPES.IChatRepository).to(ChatRepository).inSingletonScope();
container.bind<IChatService>(TYPES.IChatService).to(ChatService).inSingletonScope();
container.bind<ChatController>(TYPES.ChatController).to(ChatController).inSingletonScope();
container.bind(TYPES.ConversationModel).toConstantValue(ConversationModel);
container.bind(TYPES.MessageModel).toConstantValue(MessageModel);

export { container };