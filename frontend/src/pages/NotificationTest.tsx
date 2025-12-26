import React from 'react';
import { useNotificationContext } from '../context/NotificationContext';

const NotificationTest = () => {
  const {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    isError,
    error,
  } = useNotificationContext();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Notification Test Page</h1>
      
      {/* Connection status */}
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold">Connection Status</h2>
        <p>WebSocket Connected: {isConnected ? '✅ Yes' : '❌ No'}</p>
        <p>Loading: {isLoading ? '⏳ Yes' : '✅ No'}</p>
        {isError && <p className="text-red-500">Error: {error?.message}</p>}
      </div>
      
      {/* Notification count */}
      <div className="mb-4 p-4 bg-blue-100 rounded">
        <h2 className="font-semibold">Notification Count</h2>
        <p>Total Notifications: {notifications.length}</p>
        <p>Unread Count: {unreadCount}</p>
      </div>
      
      {/* Notifications list */}
      <div className="mb-4">
        <h2 className="font-semibold mb-2">All Notifications</h2>
        {notifications.length === 0 ? (
          <p className="text-gray-500">No notifications yet</p>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div key={notification.id} className="p-3 border rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{notification.title}</p>
                    <p className="text-sm text-gray-600">{notification.message}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!notification.read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    )}
                    <span className="text-xs text-gray-500">
                      {notification.type}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationTest;