import React from 'react';

interface TypingIndicatorProps {
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex gap-1.5 px-2">
        <span 
          className="w-2 h-2 bg-gray-500 rounded-full" 
          style={{ 
            animation: 'typing-bounce 1.4s ease-in-out infinite',
            animationDelay: '0ms'
          }}
        ></span>
        <span 
          className="w-2 h-2 bg-gray-500 rounded-full" 
          style={{ 
            animation: 'typing-bounce 1.4s ease-in-out infinite',
            animationDelay: '200ms'
          }}
        ></span>
        <span 
          className="w-2 h-2 bg-gray-500 rounded-full" 
          style={{ 
            animation: 'typing-bounce 1.4s ease-in-out infinite',
            animationDelay: '400ms'
          }}
        ></span>
      </div>
    </div>
  );
};

