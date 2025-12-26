export interface IEventService {
  start(): Promise<void>;
  stop(): Promise<void>;
  subscribe<T>(eventType: string, handler: (data: T) => Promise<void>): Promise<void>;
}