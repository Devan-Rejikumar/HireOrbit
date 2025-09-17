import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

function RegisterForm() {
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

  
  useEffect(() => {
    if (isAuthenticated && userRole) {
      switch (userRole) {
      case 'jobseeker':
        navigate('/', { replace: true });
        break;
      case 'company':
        navigate('/company/dashboard', { replace: true });
        break;
      case 'admin':
        navigate('/admin/dashboard', { replace: true });
        break;
      default:
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, userRole, navigate]);

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
    } catch (err: any) {
      setError(err.response?.data?.error || 'OTP verification failed. Please try again.');
    } finally {
      setIsLoading(false);
      setIsGeneratingOTP(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setError('');
      setSuccess('');
      const userData = await signInWithGoogle();
    
      if (userData.isNewUser) {
        setSuccess('Account created successfully with Google!');
      } else {
        setSuccess('Welcome back! Logging you in...');
      }
    
    
      await login('jobseeker'); 
    
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error: any) {
      setError('Google sign-up failed. Please try again.');
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
            navigate('/login');
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
            navigate('/login?type=company');
          }, 1500);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
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
    <Card className="max-w-md w-full shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="space-y-1 pb-6">
        <div className="flex items-center justify-center mb-4">
          {role === 'jobseeker' ? (
            <div className="p-3 bg-blue-100 rounded-full">
              <User className="w-6 h-6 text-blue-600" />
            </div>
          ) : (
            <div className="p-3 bg-purple-100 rounded-full">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
          )}
        </div>
        <CardTitle className="text-2xl font-bold text-center text-gray-900">
          Create Account
        </CardTitle>
        <CardDescription className="text-center text-gray-600">
          {role === 'jobseeker' 
            ? 'Start your career journey today' 
            : 'Find the perfect talent for your company'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <RoleToggle role={role} setRole={(role) => setRole(role)} />

        {role === 'jobseeker' && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={googleLoading}
              className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2"></div>
              ) : (
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
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
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert className="animate-in slide-in-from-top-2 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800 animate-in slide-in-from-top-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {role === 'company' && (
              <div className="space-y-2 animate-in slide-in-from-right-2">
                <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">
                  Company Name
                </Label>
                <Input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  className="transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your company name"
                />
              </div>
            )}
            
            {role === 'jobseeker' && (
              <div className="space-y-2 animate-in slide-in-from-right-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                />
              </div>
            )}
            
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
                className="transition-all duration-200 focus:ring-2 focus:ring-gray-400"
                placeholder="Enter your email address"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-gray-400"
                placeholder="Create a secure password"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className={`w-full h-11 font-semibold text-white transition-all duration-200 ${
              role === 'jobseeker' 
                ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' 
                : 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'
            } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>
                  {isGeneratingOTP ? 'Sending OTP...' : 'Creating Account...'}
                </span>
              </div>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        <div className="text-center pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <a 
              href="/login" 
              className={`font-semibold transition-colors duration-200 ${
                role === 'jobseeker' 
                  ? 'text-blue-600 hover:text-blue-500' 
                  : 'text-purple-600 hover:text-purple-500'
              }`}
            >
              Sign in
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default RegisterForm;
