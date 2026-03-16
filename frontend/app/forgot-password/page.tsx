'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import AuthLayout from '@/components/layouts/AuthLayout';
import { authApi } from '@/lib/api/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    await authApi.requestPasswordReset({ email });
    setSubmitted(true);
  } catch (err: any) {
    // Handle the actual backend error structure
    const errorMessage = 
      err.response?.data?.error || 
      err.response?.data?.message || 
      'An error occurred. Please try again.';
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};

  if (submitted) {
    return (
      <AuthLayout 
        title="Check your email" 
        subtitle={`We've sent a password reset link to ${email}`}
      >
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-start gap-3">
            <Mail className="w-5 h-5 text-[#42A7C3] shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">
              Please check your inbox and click on the link to reset your password. If you don't see it, check your spam folder.
            </p>
          </div>
          
          <Button
            onClick={() => setSubmitted(false)}
            variant="outline"
            className="w-full py-3 border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-all"
          >
            Resend Email
          </Button>

          <Link 
            href="/login" 
            className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 cursor-pointer" />
            Back to Login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Forgot Password?" 
      subtitle="No worries, we'll send you reset instructions"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700" htmlFor="email">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="pl-10 py-3 bg-gray-50 border-gray-200 focus:bg-white focus:ring-[#42A7C3] transition-all rounded-lg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <Button
          type="submit"
          className="w-full py-3 bg-[var(--primary-skyblue)] hover:bg-[var(--primary-skyblue)]/50 text-white font-semibold rounded-lg shadow-lg shadow-blue-100 transition-all transform active:scale-[0.98]"
          disabled={loading}
        >
          {loading ? <Loader size={20} className="mr-2" /> : null}
          {loading ? 'Sending...' : 'Reset Password'}
        </Button>

        <Link 
          href="/login" 
          className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 cursor-pointer" />
          Back to Login
        </Link>
      </form>
    </AuthLayout>
  );
}
