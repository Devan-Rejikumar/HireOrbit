export interface IEventService {
  publish<T>(event: string, data: T): Promise<void>;
  subscribe<T>(event: string, handler: (data: T) => Promise<void>): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
}