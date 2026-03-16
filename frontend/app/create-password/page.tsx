'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import AuthLayout from '@/components/layouts/AuthLayout';
import { authApi } from '@/lib/api/auth';

function CreatePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const requirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'At least one uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'At least one lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Contains a number', met: /\d/.test(password) },
    { label: 'Contains a special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const allRequirementsMet = requirements.every(r => r.met) && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid or missing reset token. Please request a new link.');
      return;
    }

    if (!allRequirementsMet) {
      setError('Please meet all password requirements and ensure passwords match');
      return;
    }

    setLoading(true);

    try {
      await authApi.confirmPasswordReset({
        token,
        new_password: password,
        confirm_password: confirmPassword
      });
      router.push('/login?reset=success');
    } catch (err: any) {
      // Handle the actual backend error structure (can be string or object)
      const errorMessage = 
        typeof err.response?.data === 'string' 
          ? err.response.data 
          : err.response?.data?.error || 
            err.response?.data?.message || 
            'An error occurred. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="password">
          New Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter new password"
            className="pl-10 pr-10 py-3 bg-gray-50 border-gray-200 focus:bg-white focus:ring-[#42A7C3] transition-all rounded-lg"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700" htmlFor="confirmPassword">
          Confirm Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder="Confirm new password"
            className="pl-10 pr-10 py-3 bg-gray-50 border-gray-200 focus:bg-white focus:ring-[#42A7C3] transition-all rounded-lg"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-3 py-2">
        <p className="text-sm font-medium text-gray-500">Password Requirements:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {requirements.map((req, index) => (
            <div key={index} className="flex items-center space-x-2">
              {req.met ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <X className="w-4 h-4 text-gray-300" />
              )}
              <span className={`text-xs ${req.met ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                {req.label}
              </span>
            </div>
          ))}
          <div className="flex items-center space-x-2">
            {passwordsMatch ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <X className="w-4 h-4 text-gray-300" />
            )}
            <span className={`text-xs ${passwordsMatch ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
              Passwords match
            </span>
          </div>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <Button
        type="submit"
        className={`w-full py-3 font-semibold rounded-lg shadow-lg transition-all transform active:scale-[0.98] ${
          allRequirementsMet 
            ? 'bg-[var(--primary-skyblue)] hover:bg-[var(--primary-skyblue)]/90 text-white shadow-blue-100' 
            : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
        }`}
        disabled={loading || !allRequirementsMet}
      >
        {loading ? <Loader size={20} className="mr-2" /> : null}
        {loading ? 'Updating...' : 'Reset Password'}
      </Button>
    </form>
  );
}

export default function CreatePasswordPage() {
  return (
    <AuthLayout 
      title="Create New Password" 
      subtitle="Your new password must be different from previous passwords"
    >
      <Suspense fallback={<div className="flex justify-center p-8"><Loader size={32} /></div>}>
        <CreatePasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
