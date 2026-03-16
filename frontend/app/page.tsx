'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authStore } from '@/lib/auth-store';
import LoginPage from './login/page'; // Reuse the login page component directly or redirect

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (authStore.isAuthenticated()) {
      router.push('/dashboard');
    }
  }, [router]);

  // If not authenticated, show the login page
  // We can either redirect to /login or render the login component here.
  // The user said "make the login pgae as home page for now".
  // Rendering it directly avoids a redirect flicker if we are at root.
  
  return <LoginPage />;
}
