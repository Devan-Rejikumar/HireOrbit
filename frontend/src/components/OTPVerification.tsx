import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Mail, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/api/axios';

interface OTPVerificationProps {
  email: string;
  role: string;
  onVerificationSuccess: () => void;
  onBack: () => void;
}

function OTPVerification({ email, onVerificationSuccess, onBack, role }: OTPVerificationProps) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    setCountdown(60); 
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);


  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      let response;
      if (role === 'jobseeker') {
        response = await api.post('/users/verify-otp', { email, otp });
      } else {
        response = await api.post('/company/verify-otp', { email, otp });
      }
  
      if (response.status === 200) {
        setSuccess('OTP verified successfully!');
        setTimeout(() => {
          onVerificationSuccess();
        }, 1500);
      }
    } catch (err: unknown) {
      const isAxiosError = err && typeof err === 'object' && 'response' in err;
      const axiosError = isAxiosError ? (err as { response?: { data?: { error?: string } } }) : null;
      setError(axiosError?.response?.data?.error || 'OTP verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setIsResending(true);
  
    try {
      let response;
      if (role === 'jobseeker') {
        response = await api.post('/users/resend-otp', { email });
      } else {
        response = await api.post('/company/resend-otp', { email });
      }
  
      if (response.status === 200) {
        setSuccess('New OTP sent successfully!');
        setCountdown(60); 
      }
    } catch (err: unknown) {
      const isAxiosError = err && typeof err === 'object' && 'response' in err;
      const axiosError = isAxiosError ? (err as { response?: { data?: { error?: string } } }) : null;
      setError(axiosError?.response?.data?.error || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="max-w-md w-full shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="space-y-1 pb-6">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-center text-gray-900">
          Verify Your Email
        </CardTitle>
        <CardDescription className="text-center text-gray-600">
          We've sent a 6-digit code to <span className="font-semibold">{email}</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          {error && (
            <Alert className="animate-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800 animate-in slide-in-from-top-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

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
        </form>

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

          <div className="text-center pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Registration
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default OTPVerification; 