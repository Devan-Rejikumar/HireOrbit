import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, User, Building2, Camera, Upload, X } from 'lucide-react';
import RoleToggle from './RoleToggle';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import OTPVerification from './OTPVerification';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/axios';
import type { Role } from '@/context/AuthContext';
import toast from 'react-hot-toast';

type RegisterResponse = { error?: string };

interface RegisterFormProps {
  onRoleChange?: (role: 'jobseeker' | 'company') => void;
  initialRole?: 'jobseeker' | 'company';
}

function RegisterForm({ onRoleChange, initialRole = 'jobseeker' }: RegisterFormProps) {
  const navigate = useNavigate();
  const { isAuthenticated, role: userRole, login } = useAuth();
  
  const { signInWithGoogle, loading: googleLoading } = useGoogleAuth();

  const [role, setRole] = useState<Role>(initialRole);
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [isGeneratingOTP, setIsGeneratingOTP] = useState(false);
  const [logoImage, setLogoImage] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Sync role state with initialRole prop when it changes
  useEffect(() => {
    if (initialRole && initialRole !== role) {
      setRole(initialRole);
      onRoleChange?.(initialRole);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRole]);
  
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

  const validatePassword = (passwordValue: string): boolean => {
    if (passwordValue.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordValue)) {
      setPasswordError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (newPassword.length > 0) {
      validatePassword(newPassword);
    } else {
      setPasswordError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validatePassword(password)) {
      setIsLoading(false);
      return;
    }
    
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
      
      const userData = await signInWithGoogle();
    
      if (userData.isNewUser) {
        setSuccess('Account created successfully with Google!');
      } else {
        setSuccess('Welcome back! Logging you in...');
      }
    
      // Wait a bit for the cookie to be set by the backend
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Call login which will fetch user data
      try {
        await login('jobseeker'); 
        setSuccess('Successfully signed up and logged in! You can now navigate to the home page.');
        // Don't auto-navigate - let user see the success message
      } catch (loginError: unknown) {
        const isAxiosError = loginError && typeof loginError === 'object' && 'response' in loginError;
        const axiosLoginError = isAxiosError ? (loginError as { response?: { status?: number; data?: { error?: string } }; message?: string }) : null;
        setError(`Account created, but failed to fetch user data: ${axiosLoginError?.response?.data?.error || axiosLoginError?.message || 'Unknown error'}. Please try logging in manually.`);
        // Don't auto-navigate - let user see the error
      }
    } catch (error: unknown) {
      const isAxiosError = error && typeof error === 'object' && 'response' in error;
      const axiosError = isAxiosError ? (error as { response?: { status?: number; data?: { error?: string } }; message?: string; code?: string }) : null;
      const errorMessage = axiosError?.response?.data?.error || axiosError?.message || 'Google sign-up failed. Please try again.';
      setError(errorMessage);
      // Don't auto-navigate - let user see the error
    }
  };


  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setLogoImage(file);
    const url = URL.createObjectURL(file);
    setLogoPreview(url);
  };

  const handleLogoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoImage(null);
    if (logoPreview && logoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogoPreview(null);
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
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
        // Convert logo to base64 if selected
        let logoData = null;
        if (logoImage) {
          const reader = new FileReader();
          logoData = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(logoImage);
          });
        }

        const payload = { 
          companyName, 
          email, 
          password,
          ...(logoData && { logo: logoData }),
        };
        response = await api.post<RegisterResponse>('/company/register', payload);
        
        if (response.status === 200 || response.status === 201) {
          setSuccess('Registration successful! Please login to complete your profile setup.');
          resetForm();
          if (logoPreview && logoPreview.startsWith('blob:')) {
            URL.revokeObjectURL(logoPreview);
          }
          setLogoImage(null);
          setLogoPreview(null);
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
    setPasswordError('');
    setError('');
    setSuccess('');
    if (logoPreview && logoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogoImage(null);
    setLogoPreview(null);
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
                <>
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
                  
                  {/* Company Logo Upload */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Company Logo <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => !logoPreview && logoInputRef.current?.click()}
                      className={`
                        relative w-full border-2 border-dashed rounded-xl p-6 transition-all duration-200
                        ${isDragging 
                          ? 'border-purple-500 bg-purple-50/50 scale-[1.02]' 
                          : 'border-gray-300 bg-gray-50/50 hover:border-purple-400 hover:bg-purple-50/30'
                        }
                        ${logoPreview ? 'cursor-default' : 'cursor-pointer'}
                      `}
                    >
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoSelect}
                        className="hidden"
                      />
                      
                      {logoPreview ? (
                        <div className="flex flex-col items-center space-y-4">
                          <div className="relative">
                            <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200 bg-white shadow-md">
                              <img
                                src={logoPreview}
                                alt="Company logo preview"
                                className="w-full h-full object-contain p-2"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveLogo();
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-700">{logoImage?.name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {(logoImage ? (logoImage.size / 1024 / 1024).toFixed(2) : '0')} MB
                            </p>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                logoInputRef.current?.click();
                              }}
                              className="mt-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
                            >
                              Change Logo
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center space-y-3 py-4">
                          <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                            <Upload className="h-8 w-8 text-purple-600" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              {isDragging ? 'Drop your logo here' : 'Upload Company Logo'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Drag and drop or click to browse
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              JPG, PNG up to 5MB
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
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
                  onChange={handlePasswordChange}
                  required
                  className={`border-0 border-b-2 rounded-none px-0 py-4 text-base focus:ring-0 transition-all duration-300 bg-transparent placeholder:text-gray-400 ${
                    passwordError 
                      ? 'border-red-400 focus:border-red-400 hover:border-red-400' 
                      : 'border-gray-300 focus:border-teal-400 hover:border-gray-400'
                  }`}
                  placeholder="Password"
                />
                {passwordError && (
                  <p className="text-xs text-red-600 mt-1">{passwordError}</p>
                )}
                {!passwordError && password.length > 0 && (
                  <p className="text-xs text-green-600 mt-1">Password meets requirements</p>
                )}
                {password.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Password must be at least 8 characters with uppercase, lowercase, and number
                  </p>
                )}
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
