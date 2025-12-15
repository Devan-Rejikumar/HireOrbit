import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/seperator';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/api/axios';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
  
    try {
      const response = await api.post('/users/admin/register', {
        name,
        email,
        password,
        secret: 'supersecret123',
      });
      setIsLoading(false);
      toast.success('Your admin account has been created successfully!', {
        duration: 3000,
      });
      onSwitchToLogin();
    } catch (error: unknown) {
      setIsLoading(false);
      const isAxiosError = error && typeof error === 'object' && 'response' in error;
      const axiosError = isAxiosError ? (error as { response?: { data?: { error?: string } } }) : null;
      toast.error(axiosError?.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-slate-700">
            Full Name
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-10 h-12 border-slate-200 focus:border-slate-400 focus:ring-slate-400"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12 border-slate-200 focus:border-slate-400 focus:ring-slate-400"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-slate-700">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 h-12 border-slate-200 focus:border-slate-400 focus:ring-slate-400"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2 h-8 w-8 p-0 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-slate-400" />
              ) : (
                <Eye className="h-4 w-4 text-slate-400" />
              )}
            </Button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium transition-colors"
          disabled={isLoading}
        >
          {isLoading ? 'Creating Account...' : 'Create Admin Account'}
        </Button>

        <div className="relative">
          <Separator className="my-6" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-sm text-slate-500">
            or
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full h-12 border-slate-200 text-slate-700 hover:bg-slate-50"
          onClick={onSwitchToLogin}
        >
          Already have an account? Sign in
        </Button>
      </form>
    </>
  );
};

export default RegisterForm;