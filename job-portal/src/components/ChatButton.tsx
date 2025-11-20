import { MessageCircle } from 'lucide-react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

interface ChatButtonProps {
  applicationId: string;
  disabled?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

/**
 * ChatButton Component
 * 
 * Purpose: Displays a chat button that navigates to the chat page for a specific application.
 * 
 * What it does:
 * - Shows a purple-themed chat button with message icon
 * - Navigates to /chat?applicationId={id} when clicked
 * - Can be disabled if conversation doesn't exist yet
 * - Matches LinkedIn-style design with purple gradient
 */
export const ChatButton = ({ applicationId, disabled = false, size = 'sm' }: ChatButtonProps) => {
  const navigate = useNavigate();

  const handleChatClick = () => {
    navigate(`/chat?applicationId=${applicationId}`);
  };

  return (
    <Button
      size={size}
      onClick={handleChatClick}
      disabled={disabled}
      variant="employer"
      className="flex items-center gap-2 !text-black"
    >
      <MessageCircle className="h-4 w-4" />
      Chat
    </Button>
  );
};

