import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  loading = false,
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
    case 'danger':
      return {
        icon: 'text-red-600',
        iconBg: 'bg-red-100',
        confirmBtn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      };
    case 'warning':
      return {
        icon: 'text-yellow-600',
        iconBg: 'bg-yellow-100',
        confirmBtn: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
      };
    case 'info':
      return {
        icon: 'text-blue-600',
        iconBg: 'bg-blue-100',
        confirmBtn: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      };
    default:
      return {
        icon: 'text-red-600',
        iconBg: 'bg-red-100',
        confirmBtn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full ${styles.iconBg} flex items-center justify-center mr-3`}>
              <AlertTriangle className={`h-5 w-5 ${styles.icon}`} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${styles.confirmBtn}`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Deleting...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
