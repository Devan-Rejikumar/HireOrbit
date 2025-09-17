
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import LoginForm from './AdminLoginForm';

const AdminAuth = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
    <Card className="w-full max-w-md shadow-xl border-0 bg-white/95 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center pb-6">
        <div className="flex justify-center items-center mb-4">
          <div className="bg-slate-900 p-3 rounded-full">
            <Shield className="h-6 w-6 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">
          Admin Login
        </CardTitle>
        <CardDescription className="text-slate-600">
          Sign in to your admin dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <LoginForm />
      </CardContent>
    </Card>
  </div>
);

export default AdminAuth;