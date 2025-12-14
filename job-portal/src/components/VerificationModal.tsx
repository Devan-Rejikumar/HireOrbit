import React, { useState } from 'react';
import { X, Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { userService } from '../api/userService';
import toast from 'react-hot-toast';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  onVerificationSuccess: () => void;
}

const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  onVerificationSuccess,
}) => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'send' | 'verify'>('send');
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const handleSendOTP = async () => {
    setIsSendingOtp(true);
    try {
      // await userService.sendOTP(userEmail);
      await userService.sendVerificationOTP(userEmail);
      toast.success('OTP sent to your email!');
      setStep('verify');
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      await userService.verifyOTP(userEmail, parseInt(otp));
      toast.success('Email verified successfully!');
      onVerificationSuccess();
      onClose();
      setOtp('');
      setStep('send');
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast.error('Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setOtp('');
    setStep('send');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg mr-3">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Email Verification Required</h2>
              <p className="text-sm text-gray-600">Verify your email to access all features</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Email Display */}
          <div className="flex items-center bg-gray-50 px-4 py-3 rounded-lg">
            <Mail className="h-5 w-5 mr-3 text-blue-600" />
            <span className="font-medium text-gray-900">{userEmail}</span>
          </div>

          {/* Step 1: Send OTP */}
          {step === 'send' && (
            <div className="text-center space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-gray-700">
                  We'll send a verification code to your email address. Please check your inbox and spam folder.
                </p>
              </div>
              <button
                onClick={handleSendOTP}
                disabled={isSendingOtp}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isSendingOtp ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  'Send Verification Code'
                )}
              </button>
            </div>
          )}

          {/* Step 2: Verify OTP */}
          {step === 'verify' && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-gray-700">
                  We've sent a 6-digit verification code to your email. Enter it below to verify your email.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono tracking-widest"
                  maxLength={6}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('send')}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleVerifyOTP}
                  disabled={isLoading || otp.length !== 6}
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Email'
                  )}
                </button>
              </div>

              <div className="text-center">
                <button
                  onClick={handleSendOTP}
                  disabled={isSendingOtp}
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  {isSendingOtp ? 'Resending...' : 'Didn\'t receive code? Resend'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            By verifying your email, you'll have access to all job portal features and better job recommendations.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerificationModal;
