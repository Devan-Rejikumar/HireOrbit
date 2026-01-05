import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { ENV } from '../config/env';

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

    const newSocket = io(ENV.NOTIFICATION_SERVICE_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      
      newSocket.emit('join-room', recipientId);
    });


    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });


    newSocket.on('notification', (data: RealTimeNotificationData) => {
      setRealTimeNotifications(prev => [data, ...prev]);

      queryClient.invalidateQueries({ queryKey: ['notifications', recipientId] });
      queryClient.invalidateQueries({ queryKey: ['notifications', recipientId, 'unread-count'] });
    });

    newSocket.on('connect_error', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);
    socketRef.current = newSocket;
    return () => {
      newSocket.close();
    };
  }, [recipientId, queryClient]);

  const joinRoom = (roomId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join-room', roomId);
    }
  };

  const leaveRoom = (roomId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave-room', roomId);
    }
  };

  return {
    socket,                   
    isConnected,              
    realTimeNotifications,  
    joinRoom,               
    leaveRoom,                 
  };
};