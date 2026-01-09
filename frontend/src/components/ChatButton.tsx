import { MessageCircle } from 'lucide-react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

interface ChatButtonProps {
  applicationId: string;
  disabled?: boolean;
  size?: 'sm' | 'default' | 'lg';
}


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

