import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

interface ConfirmationState {
  isOpen: boolean;
  options: ConfirmationOptions | null;
  onConfirm: (() => void) | null;
}

export const useConfirmation = () => {
  const [state, setState] = useState<ConfirmationState>({
    isOpen: false,
    options: null,
    onConfirm: null,
  });

  const confirm = (opts: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        options: opts,
        onConfirm: () => {
          setState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
      });
    });
  };

  const ConfirmationDialog = () => {
    if (!state.isOpen || !state.options) return null;

    const { title, message, confirmText = 'Confirm', cancelText = 'Cancel' } = state.options;

    const handleCancel = () => {
      setState(prev => ({ ...prev, isOpen: false }));
    };

    const handleConfirm = () => {
      if (state.onConfirm) {
        state.onConfirm();
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div 
          className="fixed inset-0 bg-black bg-opacity-50" 
          onClick={handleCancel} 
        />
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={handleCancel}
              >
                {cancelText}
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={handleConfirm}
              >
                {confirmText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return { confirm, ConfirmationDialog };
};