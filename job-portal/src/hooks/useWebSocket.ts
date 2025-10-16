import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

interface RealTimeNotificationData {
  type: 'APPLICATION_RECEIVED' | 'STATUS_UPDATED' | 'APPLICATION_WITHDRAWN';
  id: string;
  recipientId: string;
  data: {
    applicationId: string;
    jobId: string;
    applicantName?: string;
    jobTitle?: string;
    oldStatus?: string;
    newStatus?: string;
  };
  timestamp: string;
}


export const useWebSocket = (recipientId: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [realTimeNotifications, setRealTimeNotifications] = useState<RealTimeNotificationData[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();
  useEffect(() => {

    if (!recipientId) return;

    console.log(' Connecting to notification service...');
    const newSocket = io('http://localhost:4005', {
      transports: ['websocket'],
      autoConnect: true
    });

    newSocket.on('connect', () => {
      console.log(' WebSocket connected successfully');
      setIsConnected(true);
      
      newSocket.emit('join-room', recipientId);
      console.log(` Joined room for user: ${recipientId}`);
    });


    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });


    newSocket.on('notification', (data: RealTimeNotificationData) => {
      console.log('Received real-time notification:', data);

      setRealTimeNotifications(prev => [data, ...prev]);

      queryClient.invalidateQueries({ queryKey: ['notifications', recipientId] });
      queryClient.invalidateQueries({ queryKey: ['notifications', recipientId, 'unread-count'] });
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    setSocket(newSocket);
    socketRef.current = newSocket;
    return () => {
      console.log(' Closing WebSocket connection');
      newSocket.close();
    };
  }, [recipientId, queryClient]);

  const joinRoom = (roomId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join-room', roomId);
      console.log(`Joined room: ${roomId}`);
    }
  };

  const leaveRoom = (roomId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave-room', roomId);
      console.log(`Left room: ${roomId}`);
    }
  };

  return {
    socket,                   
    isConnected,              
    realTimeNotifications,  
    joinRoom,               
    leaveRoom                 
  };
};