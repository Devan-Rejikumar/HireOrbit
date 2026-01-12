import React, { useEffect, useState } from 'react';
import { Clock, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RateLimitModalProps {
  isOpen: boolean;
  retryAfter: number; // seconds
  onClose: () => void;
}

const RateLimitModal: React.FC<RateLimitModalProps> = ({ 
  isOpen, 
  retryAfter, 
  onClose 
}) => {
  const [timeRemaining, setTimeRemaining] = useState(retryAfter);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Reset when modal opens
    setTimeRemaining(retryAfter);
    setCanClose(false);

    // Countdown timer
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanClose(true);
          // Auto-close after 1 second of showing "0"
          setTimeout(() => {
            onClose();
          }, 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, retryAfter, onClose]);

  if (!isOpen) return null;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}s`;
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Backdrop - non-clickable until countdown ends */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity ${
          canClose ? 'bg-opacity-50 cursor-pointer' : 'bg-opacity-70 cursor-not-allowed'
        }`}
        onClick={canClose ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Too Many Requests</h2>
            </div>
            {canClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="text-center mb-6">
              {/* Countdown Timer */}
              <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                <Clock className="w-12 h-12 text-orange-600" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-orange-600">
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Rate Limit Exceeded
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                You've made too many requests in a short period. Please wait before trying again.
              </p>
              
              {!canClose && (
                <p className="text-sm text-gray-500 italic">
                  This window will close automatically when the timer reaches zero.
                </p>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> To avoid rate limits, please space out your requests and avoid rapid clicking.
              </p>
            </div>

            {/* Actions */}
            {canClose && (
              <div className="flex justify-center">
                <Button
                  onClick={onClose}
                  className="bg-orange-600 hover:bg-orange-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                >
                  Continue
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateLimitModal;

