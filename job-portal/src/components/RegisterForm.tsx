import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, User, Building2 } from 'lucide-react';
import RoleToggle from './RoleToggle';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import OTPVerification from './OTPVerification';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/axios';
import type { Role } from '@/context/AuthContext';

type RegisterResponse = { error?: string };

interface RegisterFormProps {
  onRoleChange?: (role: 'jobseeker' | 'company') => void;
}

function RegisterForm({ onRoleChange }: RegisterFormProps) {
  const navigate = useNavigate();
  const { isAuthenticated, role: userRole, login } = useAuth();
  
  const { signInWithGoogle, loading: googleLoading } = useGoogleAuth();

  const [role, setRole] = useState<Role>('jobseeker');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [isGeneratingOTP, setIsGeneratingOTP] = useState(false);

  
  // Disabled auto-navigation to allow error visibility during Google signup debugging
  // useEffect(() => {
  //   if (isAuthenticated && userRole) {
  //     switch (userRole) {
  //     case 'jobseeker':
  //       navigate('/', { replace: true });
  //       break;
  //     case 'company':
  //       navigate('/company/dashboard', { replace: true });
  //       break;
  //     case 'admin':
  //       navigate('/admin/dashboard', { replace: true });
  //       break;
  //     default:
  //       navigate('/', { replace: true });
  //     }
  //   }
  // }, [isAuthenticated, userRole, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (role === 'jobseeker') {
        setIsGeneratingOTP(true);
        const otpResponse = await api.post('/users/generate-otp', { email });
        
        if (otpResponse.status === 200) {
          setShowOTPVerification(true);
          setSuccess('OTP sent to your email!');
        }
      } else {
        setIsGeneratingOTP(true);
        const otpResponse = await api.post('/company/generate-otp', { email });

        if (otpResponse.status === 200) {
          setShowOTPVerification(true);
          setSuccess('OTP sent to your email!');
        }
      }
    } catch (err: unknown) {
      const isAxiosError = err && typeof err === 'object' && 'response' in err;
      const axiosError = isAxiosError ? (err as { response?: { data?: { error?: string } } }) : null;
      setError(axiosError?.response?.data?.error || 'OTP verification failed. Please try again.');
    } finally {
      setIsLoading(false);
      setIsGeneratingOTP(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setError('');
      setSuccess('');
      console.log('[RegisterForm] Starting Google sign-up...');
      
      const userData = await signInWithGoogle();
      console.log('[RegisterForm] Google sign-up successful:', { 
        isNewUser: userData.isNewUser, 
        hasToken: !!userData.token,
        userEmail: userData.user?.email 
      });
    
      if (userData.isNewUser) {
        setSuccess('Account created successfully with Google!');
      } else {
        setSuccess('Welcome back! Logging you in...');
      }
    
      // Wait a bit for the cookie to be set by the backend
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Call login which will fetch user data
      try {
        console.log('[RegisterForm] Calling login function...');
        await login('jobseeker'); 
        console.log('[RegisterForm] Login successful!');
        setSuccess('Successfully signed up and logged in! You can now navigate to the home page.');
        // Don't auto-navigate - let user see the success message
      } catch (loginError: unknown) {
        console.error('[RegisterForm] Login after Google signup failed:', loginError);
        const isAxiosError = loginError && typeof loginError === 'object' && 'response' in loginError;
        const axiosLoginError = isAxiosError ? (loginError as { response?: { status?: number; data?: { error?: string } }; message?: string }) : null;
        console.error('[RegisterForm] Error details:', {
          status: axiosLoginError?.response?.status,
          data: axiosLoginError?.response?.data,
          message: axiosLoginError?.message
        });
        setError(`Account created, but failed to fetch user data: ${axiosLoginError?.response?.data?.error || axiosLoginError?.message || 'Unknown error'}. Please try logging in manually.`);
        // Don't auto-navigate - let user see the error
      }
    } catch (error: unknown) {
      console.error('[RegisterForm] Google sign-up error:', error);
      const isAxiosError = error && typeof error === 'object' && 'response' in error;
      const axiosError = isAxiosError ? (error as { response?: { status?: number; data?: { error?: string } }; message?: string; code?: string }) : null;
      console.error('[RegisterForm] Error details:', {
        status: axiosError?.response?.status,
        data: axiosError?.response?.data,
        message: axiosError?.message,
        code: axiosError?.code
      });
      const errorMessage = axiosError?.response?.data?.error || axiosError?.message || 'Google sign-up failed. Please try again.';
      setError(errorMessage);
      // Don't auto-navigate - let user see the error
    }
  };


  const handleOTPVerificationSuccess = async () => {
    try {
      let response;
      if (role === 'jobseeker') {
        const payload = { name, email, password };
        response = await api.post<RegisterResponse>('/users/register', payload);
        
        if (response.status === 200 || response.status === 201) {
          setSuccess('Registration successful! Please login.');
          resetForm();
          setShowOTPVerification(false);
          setTimeout(() => {
            navigate(ROUTES.LOGIN);
          }, 1500); 
        }
      } else {
        
        const payload = { companyName, email, password };
        response = await api.post<RegisterResponse>('/company/register', payload);
        
        if (response.status === 200 || response.status === 201) {
          setSuccess('Registration successful! Please login to complete your profile setup.');
          resetForm();
          setShowOTPVerification(false);
          setTimeout(() => {
            navigate(`${ROUTES.LOGIN}?type=company`);
          }, 1500);
        }
      }
    } catch (err: unknown) {
      const isAxiosError = err && typeof err === 'object' && 'response' in err;
      const axiosError = isAxiosError ? (err as { response?: { data?: { error?: string } } }) : null;
      setError(axiosError?.response?.data?.error || 'Registration failed. Please try again.');
    }
  };

  const handleBackToRegistration = () => {
    setShowOTPVerification(false);
    setError('');
    setSuccess('');
  };

  const resetForm = () => {
    setName('');
    setCompanyName('');
    setEmail('');
    setPassword('');
    setError('');
    setSuccess('');
  };

  if (showOTPVerification) {
    return (
      <OTPVerification
        email={email}
        role={role || 'jobseeker'}
        onVerificationSuccess={handleOTPVerificationSuccess}
        onBack={handleBackToRegistration}
      />
    );
  }

  return (
    <div className="w-full bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-white/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-teal-400/20 to-blue-500/20 rounded-full translate-y-12 -translate-x-12"></div>
      
      <div className="relative z-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">Sign up</h1>
          <p className="text-gray-600">Create your account and start your journey with us.</p>
        </div>
      
      <div className="space-y-4">
        <RoleToggle role={role} setRole={(newRole) => {
          setRole(newRole);
          onRoleChange?.(newRole as 'jobseeker' | 'company');
        }} />

        {role === 'jobseeker' && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={googleLoading}
              className="w-full flex justify-center items-center px-4 py-2.5 border border-gray-300 rounded-xl shadow-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2"></div>
              ) : (
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Sign up with Google
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or sign up with email</span>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert className="animate-in slide-in-from-top-2 border-red-200 bg-red-50/80 backdrop-blur-sm">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50/80 backdrop-blur-sm text-green-800 animate-in slide-in-from-top-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            {role === 'company' && (
              <div className="space-y-2">
                <Input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  className="border-0 border-b-2 border-gray-300 rounded-none px-0 py-4 text-base focus:border-teal-400 focus:ring-0 transition-all duration-300 bg-transparent placeholder:text-gray-400 hover:border-gray-400"
                  placeholder="Company Name"
                />
              </div>
            )}
            
            {role === 'jobseeker' && (
              <div className="space-y-2">
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="border-0 border-b-2 border-gray-300 rounded-none px-0 py-4 text-base focus:border-teal-400 focus:ring-0 transition-all duration-300 bg-transparent placeholder:text-gray-400 hover:border-gray-400"
                  placeholder="Full Name"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-0 border-b-2 border-gray-300 rounded-none px-0 py-4 text-base focus:border-teal-400 focus:ring-0 transition-all duration-300 bg-transparent placeholder:text-gray-400 hover:border-gray-400"
                placeholder="Email"
              />
            </div>
            
            <div className="space-y-2">
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-0 border-b-2 border-gray-300 rounded-none px-0 py-4 text-base focus:border-teal-400 focus:ring-0 transition-all duration-300 bg-transparent placeholder:text-gray-400 hover:border-gray-400"
                placeholder="Password"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-14 bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-600 hover:to-purple-700 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 focus:ring-4 focus:ring-purple-200 transform hover:scale-[1.02]"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>
                  {isGeneratingOTP ? 'Sending OTP...' : 'Creating Account...'}
                </span>
              </div>
            ) : (
              'Sign up'
            )}
          </Button>
        </form>

        <div className="text-center pt-6 border-t border-gray-200/50">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <a
              href={ROUTES.LOGIN}
              className="font-semibold text-purple-500 hover:text-purple-600 transition-colors duration-300 hover:underline"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}

export default RegisterForm;
