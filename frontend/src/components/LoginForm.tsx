import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/constants/routes';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Mail, Lock, AlertCircle, User, Building2, CheckCircle } from 'lucide-react';
import RoleToggle from './RoleToggle';
import ForgotPassword from './ForgotPassword';
import api from '@/api/axios';

interface LoginFormProps {
  onRoleChange?: (role: 'jobseeker' | 'company') => void;
}

const LoginForm = ({ onRoleChange }: LoginFormProps) => {
  const navigate = useNavigate();
  const { login, isAuthenticated, role: userRole } = useAuth();
  const { signInWithGoogle, loading: googleLoading } = useGoogleAuth();
  
  const [role, setRole] = useState<'jobseeker' | 'company'>('jobseeker');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);


  // Disabled auto-navigation to allow error visibility during Google signin debugging
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
    setLoading(true);
    setError('');
    setSuccess('');

    try {
    
      let response;
      if (role === 'jobseeker') {
        response = await api.post('/users/login', { 
          email, 
          password, 
          role: 'jobseeker',
        });
      } else if (role === 'company') {
        response = await api.post('/company/login', { 
          email, 
          password, 
        });
      }
      
     
      await login(role);
      
    
      switch (role) {
      case 'jobseeker':
        navigate(ROUTES.HOME);
        break;
      case 'company':
        navigate(ROUTES.COMPANY_DASHBOARD);
        break;
      default:
        navigate(ROUTES.HOME);
      }
    } catch (err: unknown) {
      const isAxiosError = err && typeof err === 'object' && 'response' in err;
      const axiosError = isAxiosError ? (err as { response?: { data?: { error?: string } } }) : null;
      setError(axiosError?.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setSuccess('');
      
      const userData = await signInWithGoogle();
      
      // Wait a bit for the cookie to be set by the backend
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Call login which will fetch user data
      try {
        await login('jobseeker');
        setSuccess('Successfully signed in! You can now navigate to the home page.');
        // Don't auto-navigate - let user see the success message
      } catch (loginError: unknown) {
        const isAxiosError = loginError && typeof loginError === 'object' && 'response' in loginError;
        const axiosLoginError = isAxiosError ? (loginError as { response?: { status?: number; data?: { error?: string } }; message?: string }) : null;
        setError(`Failed to fetch user data: ${axiosLoginError?.response?.data?.error || axiosLoginError?.message || 'Unknown error'}`);
        // Don't auto-navigate - let user see the error
      }
      
    } catch (error: unknown) {
      const isAxiosError = error && typeof error === 'object' && 'response' in error;
      const axiosError = isAxiosError ? (error as { response?: { status?: number; data?: { error?: string } }; message?: string; code?: string }) : null;
      const errorMessage = axiosError?.response?.data?.error || axiosError?.message || 'Google sign-in failed. Please try again.';
      setError(errorMessage);
      // Don't auto-navigate - let user see the error
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setError('');
    setSuccess('');

    try {
      const endpoint = role === 'jobseeker' ? '/users/forgot-password' : '/company/forgot-password';
      await api.post(endpoint, { email: resetEmail });
      setSuccess('Password reset link sent to your email!');
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetEmail('');
        setSuccess('');
      }, 3000);
    } catch (err: unknown) {
      const isAxiosError = err && typeof err === 'object' && 'response' in err;
      const axiosError = isAxiosError ? (err as { response?: { data?: { error?: string } } }) : null;
      setError(axiosError?.response?.data?.error || 'Failed to send reset email');
    } finally {
      setResetLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <ForgotPassword onSwitchToLogin={() => setShowForgotPassword(false)} />
    );
  }

  return (
    <div className="w-full bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-white/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-400/20 to-blue-500/20 rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/20 to-pink-500/20 rounded-full translate-y-12 -translate-x-12"></div>
      
      <div className="relative z-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">Log in</h1>
          <p className="text-gray-600">Welcome back! Please sign in to your account.</p>
        </div>

        <div className="space-y-4">
          <RoleToggle role={role} setRole={(newRole) => {
            setRole(newRole as 'jobseeker' | 'company');
            onRoleChange?.(newRole as 'jobseeker' | 'company');
          }} />

          {/* Google Sign-In (Only for Job Seekers) */}
          {role === 'jobseeker' && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
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
              Continue with Google
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with email</span>
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
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-0 border-b-2 border-gray-300 rounded-none px-0 py-4 pr-12 text-base focus:border-teal-400 focus:ring-0 transition-all duration-300 bg-transparent placeholder:text-gray-400 hover:border-gray-400"
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-300 p-2 rounded-full hover:bg-gray-100/50"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>


            <Button 
              type="submit" 
              className="w-full h-14 bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 hover:from-teal-500 hover:via-teal-600 hover:to-teal-700 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 focus:ring-4 focus:ring-teal-200 transform hover:scale-[1.02]"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Log in'
              )}
            </Button>

            {/* Forgot Password Link */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-gray-600 hover:text-teal-500 transition-colors duration-300 font-medium"
              >
              Forgot password?
              </button>
            </div>
          </form>

          <div className="text-center pt-6 border-t border-gray-200/50">
            <p className="text-sm text-gray-600">
            Don't have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-teal-500 hover:text-teal-600 transition-colors duration-300 hover:underline"
              >
              Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
