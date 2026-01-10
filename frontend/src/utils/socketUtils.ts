import { io, Socket, ManagerOptions, SocketOptions } from 'socket.io-client';

/**
 * Creates a Socket.IO connection that correctly handles path-based URLs.
 * 
 * Socket.IO ignores the path portion of the URL by default and uses /socket.io/ as the path.
 * This utility extracts the path from the URL and configures Socket.IO correctly.
 * 
 * Example:
 * - Input URL: wss://api.devanarayanan.site/chat-socket
 * - Socket.IO connects to: wss://api.devanarayanan.site
 * - With path: /chat-socket/socket.io
 * 
 * @param socketUrl - The full WebSocket URL including the path
 * @param options - Additional Socket.IO options
 * @returns Configured Socket instance
 */
export function createSocketConnection(
  socketUrl: string,
  options: Partial<ManagerOptions & SocketOptions> = {}
): Socket {
  const url = new URL(socketUrl);
  
  // If path is root, use default /socket.io, otherwise append /socket.io to the path
  const socketPath = url.pathname === '/' ? '/socket.io' : `${url.pathname}/socket.io`;

  console.log(`🔌 Socket connecting to origin: ${url.origin}, path: ${socketPath}`);

  return io(url.origin, {
    path: socketPath,
    ...options,
  });
}

