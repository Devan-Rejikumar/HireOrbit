import React, { useCallback } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dropdown, DropdownContent, DropdownItem, DropdownHeader } from './ui/dropdown';
import { useNotificationContext } from '../context/NotificationContext';

// Main notification bell component
export const NotificationBell: React.FC = () => {
  // Get all notification data and functions from context
  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    deleteNotification,
    markAllAsRead,
    handleNotificationClick
  } = useNotificationContext();

  // Function to format notification message based on type
  const formatNotificationMessage = (notification: any) => {
    // Use the message from the notification if available (for stored notifications)
    if (notification.message) {
      return notification.message;
    }
    
    // Fallback to formatting based on type and data
    switch (notification.type) {
      case 'APPLICATION_RECEIVED':
        return `${notification.data.applicantName || 'Someone'} applied for ${notification.data.jobTitle || 'a job'}`;
      case 'STATUS_UPDATED':
        const jobTitle = notification.data.jobTitle || 'Application';
        const newStatus = notification.data.newStatus || notification.data.status || 'unknown';
        return `${jobTitle} status has been changed to ${newStatus}`;
      case 'APPLICATION_WITHDRAWN':
        return `${notification.data.applicantName || 'Someone'} withdrew their application`;
      case 'INTERVIEW_CONFIRMED':
        const interviewJobTitle = notification.data.jobTitle || 'the position';
        return `Your interview for ${interviewJobTitle} has been confirmed`;
      default:
        return 'New notification';
    }
  };

  // Function to format time (e.g., "2m ago", "1h ago")
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <Dropdown
      trigger={
        <Button variant="ghost" size="icon" className="relative">
          {/* Show different bell icon based on unread count */}
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5 text-blue-600" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          
          {/* Show badge with unread count */}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          
          {/* Show connection status indicator */}
          {!isConnected && (
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
          )}
        </Button>
      }
      className="w-80"
      onOpen={useCallback(() => {
        // Mark all notifications as read when dropdown opens
        if (unreadCount > 0) {
          markAllAsRead();
        }
      }, [unreadCount, markAllAsRead])}
    >
      <DropdownContent>
        {/* Header with title and mark all as read button */}
        <DropdownHeader>
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Notifications</h3>
              {!isConnected && (
                <span className="text-xs text-red-500">(Offline)</span>
              )}
            </div>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs"
              >
                Mark all as read
              </Button>
            )}
          </div>
        </DropdownHeader>
        
        {/* Notifications list */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            // Show message when no notifications
            <div className="p-4 text-center text-gray-500">
              No notifications yet
            </div>
          ) : (
            // Show list of notifications
            notifications.map((notification, index) => (
              <DropdownItem
                key={notification.id || notification._id || `notification-${index}-${notification.createdAt}`}
                className={`flex flex-col items-start p-3 border-b border-gray-100 ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
                onClick={() => {
                  // Handle notification click (already marks as read and navigates)
                  handleNotificationClick(notification);
                }}
              >
                {/* Notification message and time */}
                <div className="flex items-center justify-between w-full">
                  <span className={`text-sm font-medium ${
                    !notification.read ? 'font-semibold' : ''
                  }`}>
                    {formatNotificationMessage(notification)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTime(notification.createdAt)}
                  </span>
                </div>
                
                {/* Notification type and read status */}
                <div className="flex items-center justify-between w-full mt-1">
                  <span className="text-xs text-gray-500">
                    {notification.type.replace('_', ' ').toLowerCase()}
                  </span>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              </DropdownItem>
            ))
          )}
        </div>
      </DropdownContent>
    </Dropdown>
  );
};