'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { authApi } from '@/lib/api/auth';
import { authStore } from '@/lib/auth-store';
import { Loader } from '@/components/ui/loader';
import AuthLayout from '@/components/layouts/AuthLayout';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Helper to get cookie
  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  };

  // Helper to set cookie
  const setCookie = (name: string, value: string, days: number) => {
    if (typeof document === 'undefined') return;
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `; expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value || ""}${expires}; path=/`;
  };

  // Check for success message in URL and load remembered username
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset') === 'success') {
      setSuccess('Password reset successfully. Please sign in with your new password.');
    }

    const savedUsername = getCookie('remembered_username');
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await authApi.login({ username, password });
      
      if (response && response.access) {
        // Handle Remember Me
        if (rememberMe) {
          setCookie('remembered_username', username, 30); // Save for 30 days
        } else {
          setCookie('remembered_username', '', -1); // Clear cookie
        }

        authStore.setTokens(response.access, response.refresh);
        if (response.user) {
            authStore.setUser(response.user);
        }
        
        setIsRedirecting(true);
        router.push('/dashboard');
      } else {
        setError('Login failed. API returned an unexpected response structure.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred during login.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Welcome Back" 
      subtitle="Please enter your credentials to access the dashboard"
    >
      <form onSubmit={handleLogin} className="space-y-6">
        {success && (
          <div className="p-4 bg-green-50 rounded-xl border border-green-100 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700" htmlFor="username">
            Username
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              className="pl-10 py-3 bg-gray-50 border-gray-200 focus:bg-white focus:ring-[#42A7C3] transition-all rounded-lg"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
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

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="remember" 
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              className="border-gray-300 data-[state=checked]:bg-[var(--primary-skyblue)] data-[state=checked]:border-[var(--primary-skyblue)]" 
            />
            <label htmlFor="remember" className="text-sm text-gray-500 cursor-pointer">
              Remember me
            </label>
          </div>
          <Link href="/forgot-password" title="Forgot Password?" className="text-sm text-[var(--primary-skyblue)] hover:underline font-medium cursor-pointer">
            Forgot Password?
          </Link>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <Button
          type="submit"
          className="w-full py-3 bg-[var(--primary-skyblue)] hover:bg-[var(--primary-skyblue)]/50 text-white font-semibold rounded-lg shadow-lg shadow-blue-100 transition-all transform active:scale-[0.98] cursor-pointer"
          disabled={loading}
        >
          {loading ? <Loader size={20} className="mr-2" /> : null}
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>

        {/* <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <a href="#" className="text-[var(--primary-skyblue)] hover:underline font-medium">
            Contact Administrator
          </a>
        </p> */}
      </form>
    </AuthLayout>
  );
}