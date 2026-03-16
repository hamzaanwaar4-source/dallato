"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Settings, 
  Building2, 
  LogOut,
  MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authApi } from "@/lib/api/auth";
import { authStore } from "@/lib/auth-store";
import { toast } from "sonner";

interface SidebarItem {
  icon: any;
  label: string;
  href: string;
}

export function SuperAdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const refresh = authStore.getRefreshToken();
      if (refresh) {
        await authApi.logout(refresh);
      }
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout failed", error);
      toast.success("Logged out successfully");
    } finally {
      authStore.clearAuth();
      router.push("/");
    }
  };

  const sidebarItems: SidebarItem[] = [
    { icon: LayoutDashboard, label: "Settings Dashboard", href: "/dashboard" },
    { icon: Building2, label: "Manage Agency", href: "/manage-agencies" },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden border-r md:block w-64 h-screen bg-card">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center px-6">
            <div className="flex items-center gap-2 font-bold text-xl text-primary">
              <MapPin className="h-6 w-6 shrink-0 text-[#43ABFF]" />
              <span>Ask Tara</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="grid gap-1 px-2">
              {sidebarItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-black",
                    pathname === item.href
                      ? "bg-[var(--primary-skyblue)] text-white hover:bg-[var(--primary-skyblue)]/90 hover:text-white"
                      : "text-muted-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Logout */}
          <div className="p-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium hover:bg-red-50 rounded-lg transition-colors text-muted-foreground cursor-pointer"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
