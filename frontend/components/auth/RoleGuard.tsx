"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authStore } from "@/lib/auth-store";
import { Loader } from "@/components/ui/loader";

const ROLE_PATHS: Record<string, string[]> = {
  "Platform SuperAdmin": ["/dashboard", "/manage-agencies", "/super-admin/crm-overview","/system-check", "/super-admin/hotels", "/super-admin/flights"],
  "Agency Admin": ["/dashboard", "/manage-agents", "/agent-analytics", "/bookings-quotes", "/manage-suppliers", "/crm-overview"],
  "Agency Agent": ["/dashboard", "/quote-assistant", "/quotes", "/manage-bookings", "/clients", "/settings","/profile"],
};

export function RoleGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthorization = () => {
      const user = authStore.getUser();
      const role = user?.role || "Agency Agent";
      const allowedPaths = ROLE_PATHS[role] || [];


      const isAllowed = allowedPaths.some(path => 
        pathname === path || pathname.startsWith(`${path}/`)
      );

      if (!isAllowed && pathname !== "/dashboard") {
        console.warn(`Unauthorized access attempt to ${pathname} by role ${role}`);
        router.replace("/dashboard");
      } else {
        setIsAuthorized(true);
      }
      setIsLoading(false);
    };

    checkAuthorization();
  }, [pathname, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
