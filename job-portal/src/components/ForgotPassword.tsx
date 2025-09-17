import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/seperator';
import { Mail, CheckCircle, AlertCircle, ArrowLeft, Lock } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import api from '@/api/axios';
import { useNavigate } from 'react-router-dom';

interface ForgotPasswordProps {
  onSwitchToLogin?: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onSwitchToLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  
  const [stage, setStage] = useState(1);

 
  React.useEffect(() => {
    if (stage === 2 && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, stage]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await api.post('/users/forgot-password', { email });
      if (response.status === 200) {
        setSuccess('OTP sent to your email!');
        setStage(2);
        setCountdown(60); 
        toast.success('OTP sent to your email!', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
      toast.error(err.response?.data?.error || 'Failed to send OTP', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await api.post('/users/verify-password-reset-otp', { email, otp });
      if (response.status === 200) {
        setSuccess('OTP verified successfully!');
        setStage(3);
        toast.success('OTP verified successfully!', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'OTP verification failed. Please try again.');
      toast.error(err.response?.data?.error || 'OTP verification failed', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setIsResending(true);

    try {
      const response = await api.post('/users/forgot-password', { email });
      if (response.status === 200) {
        setSuccess('New OTP sent successfully!');
        setCountdown(60); // 60 seconds cooldown
        toast.success('New OTP sent successfully!', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend OTP. Please try again.');
      toast.error(err.response?.data?.error || 'Failed to resend OTP', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setIsResending(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post('/users/reset-password', { 
        email, 
        newPassword, 
        confirmPassword, 
      });
      
      if (response.status === 200) {
        setSuccess('Password reset successful!');
        toast.success('Password reset successful! Please login with your new password.', {
          position: 'top-right',
          autoClose: 3000,
        });
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          if (onSwitchToLogin) {
            onSwitchToLogin();
          } else {
            navigate('/login');
          }
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Password reset failed. Please try again.');
      toast.error(err.response?.data?.error || 'Password reset failed', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (stage === 1) {
      if (onSwitchToLogin) {
        onSwitchToLogin();
      } else {
        navigate('/login');
      }
    } else {
      setStage(stage - 1);
      setError('');
      setSuccess('');
    }
  };

  return (
    <Card className="max-w-md w-full shadow-xl border-0 bg-white/80 backdrop-blur-sm mx-auto">
      <CardHeader className="space-y-1 pb-6">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            {stage === 1 && <Mail className="w-6 h-6 text-blue-600" />}
            {stage === 2 && <Mail className="w-6 h-6 text-blue-600" />}
            {stage === 3 && <Lock className="w-6 h-6 text-blue-600" />}
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-center text-gray-900">
          {stage === 1 && 'Forgot Password'}
          {stage === 2 && 'Verify OTP'}
          {stage === 3 && 'Reset Password'}
        </CardTitle>
        <CardDescription className="text-center text-gray-600">
          {stage === 1 && 'Enter your email to receive a password reset code'}
          {stage === 2 && `We've sent a 6-digit code to ${email}`}
          {stage === 3 && 'Create a new password for your account'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error && (
          <Alert className="animate-in slide-in-from-top-2 bg-red-50 border-red-200 text-red-800">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="border-green-200 bg-green-50 text-green-800 animate-in slide-in-from-top-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Stage 1: Email Input */}
        {stage === 1 && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email address"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending...</span>
                </div>
              ) : (
                'Send Reset Code'
              )}
            </Button>
          </form>
        )}

        {/* Stage 2: OTP Verification */}
        {stage === 2 && (
          <form onSubmit={handleOTPVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-sm font-medium text-gray-700">
                Enter 6-digit OTP
              </Label>
              <Input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                className="text-center text-lg font-mono tracking-widest transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                placeholder="000000"
                maxLength={6}
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 transition-all duration-200"
              disabled={isLoading || otp.length !== 6}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying...</span>
                </div>
              ) : (
                'Verify OTP'
              )}
            </Button>

            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Didn't receive the code?
                </p>
                {countdown > 0 && (
                  <p className="text-sm text-gray-500 text-center mb-2">
                    You can resend OTP in 00:{countdown.toString().padStart(2, '0')}
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResendOTP}
                  disabled={isResending || countdown > 0}
                  className="text-sm"
                >
                  {isResending ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Resending...</span>
                    </div>
                  ) : countdown > 0 ? (
                    `Resend in ${countdown}s`
                  ) : (
                    'Resend OTP'
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Stage 3: New Password Input */}
        {stage === 3 && (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                New Password
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                placeholder="Confirm new password"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Resetting Password...</span>
                </div>
              ) : (
                'Reset Password'
              )}
            </Button>
          </form>
        )}

        <div className="text-center pt-4 border-t border-gray-100">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {stage === 1 ? 'Back to Login' : 'Back'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ForgotPassword;