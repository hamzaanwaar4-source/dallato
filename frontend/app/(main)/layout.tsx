'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AgentDashboardLayout } from "@/components/layouts/agent-dashboard-layout";
import { authStore } from '@/lib/auth-store';

import { RoleGuard } from '@/components/auth/RoleGuard';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = authStore.isAuthenticated();
      if (!isAuth) {
        router.replace('/login'); // Redirect to login page
      } else {
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null; // Don't render anything while redirecting
  }

  return (
    <RoleGuard>
      <AgentDashboardLayout>{children}</AgentDashboardLayout>
    </RoleGuard>
  );
}
