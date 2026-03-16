"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Wallet,
  Users,
  Settings,
  LogOut,
  MapPin,
  Menu,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CalendarDays,
  Globe,
  Play,
  Activity,
  Building2,
  Plane,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import Image from "next/image";
import sidebarImage from "@/app/assets/dashboard/sidebar-image.jpg";
import { authApi } from "@/lib/api/auth";
import { authStore } from "@/lib/auth-store";
import { toast } from "sonner";
import { fetchUserDashboardStats } from "@/lib/api/dashboard.api";

interface SidebarContentProps extends React.HTMLAttributes<HTMLDivElement> {
  onLinkClick?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface SidebarItem {
  icon: any;
  label: string;
  href: string;
  isParent?: boolean;
  children?: {
    icon: any;
    label: string;
    href: string;
  }[];
  badge?: number;
}

function SidebarContent({
  className,
  onLinkClick,
  collapsed,
  onToggleCollapse,
  ...props
}: SidebarContentProps) {
  const pathname = usePathname();
  const [isBookingsOpen, setIsBookingsOpen] = useState(false);
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [clientCount, setClientCount] = useState<number>();

  useEffect(() => {
    const user = authStore.getUser();
    setRole(user?.role || "Agency Agent");
  }, []);

  // useEffect(() => {
  //   const fetchStats = async () => {
  //     try {
  //       const stats = await fetchUserDashboardStats()
  //       setClientCount(stats.total_clients)
  //     } catch (error) {
  //       console.error("Failed to fetch sidebar stats", error)
  //     }
  //   }

  //   if (role === 'Agency Agent') {
  //     fetchStats()
  //   }
  // }, [role])

  const handleLogout = async () => {
    try {
      const refresh = authStore.getRefreshToken();
      if (refresh) {
        await authApi.logout(refresh);
      }
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout failed", error);
      // Even if API fails, we still logout locally
      toast.success("Logged out successfully");
    } finally {
      authStore.clearAuth();
      router.push("/");
    }
  };

  const agentItems: SidebarItem[] = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Sparkles, label: "Quote Assistant", href: "/quote-assistant" },
    {
      icon: CalendarDays,
      label: "Bookings",
      href: "#",
      isParent: true,
      children: [
        { icon: FileText, label: "Quotes", href: "/quotes" },
        { icon: Wallet, label: "Manage Bookings", href: "/manage-bookings" },
      ],
    },
    { icon: Users, label: "Clients", href: "/clients", badge: clientCount },
    // { icon: Settings, label: "Settings", href: "/settings" },
  ];

  const adminItems: SidebarItem[] = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Users, label: "Manage Agents", href: "/manage-agents" },
    { icon: CalendarDays, label: "Agent Analytics", href: "/agent-analytics" },
    { icon: FileText, label: "Bookings & Quotes", href: "/bookings-quotes" },
    { icon: Globe, label: "Manage Suppliers", href: "/manage-suppliers" },
    { icon: Play, label: "CRM Overview", href: "/crm-overview" },
    // { icon: Settings, label: "Settings", href: "/settings" },
  ];

  const superAdminItems: SidebarItem[] = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Globe, label: "Manage Agency", href: "/manage-agencies" },
    { icon: Play, label: "CRM Overview", href: "/super-admin/crm-overview" },
    { icon: Building2, label: "Hotels", href: "/super-admin/hotels" },
    { icon: Plane, label: "Flights", href: "/super-admin/flights" },
    { icon: Activity, label: "System Check", href: "/system-check" },
  ];

  const sidebarItems = 
    role === "Platform SuperAdmin" 
      ? superAdminItems 
      : role === "Agency Admin" 
      ? adminItems 
      : agentItems;

  // Sync expansion with active route
  useEffect(() => {
    const isBookingsActive = sidebarItems
      .find((item) => item.label === "My Bookings")
      ?.children?.some((child) => pathname === child.href);
    if (isBookingsActive) {
      setIsBookingsOpen(true);
    }
  }, [pathname]);

  const handleBookingsClick = () => {
    if (collapsed) return;

    if (!isBookingsOpen) {
      // If opening, navigate to the first child (Quotes)
      router.push("/quotes");
      setIsBookingsOpen(true);
    } else {
      // If closing, just toggle state
      setIsBookingsOpen(false);
    }
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-card transition-all duration-300 z-[5000]",
        className,
      )}
      {...props}>
      <div
        className={cn(
          "flex h-16 items-center",
          collapsed ? "justify-center px-2" : "px-6",
        )}>
        <div className="flex items-center gap-2 font-bold text-xl text-primary overflow-hidden whitespace-nowrap flex-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[var(--primary-skyblue)] rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full" />
            </div>
          </div>          {!collapsed && (
            <span className="transition-opacity duration-300">
              <Link href="/dashboard">Ask Tara</Link>
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid gap-1 px-2">
          {sidebarItems.map((item, index) => {
            if (item.isParent && item.children) {
              const isActive = item.children.some(
                (child) => pathname === child.href,
              );

              return (
                <div key={index} className="space-y-1">
                  <button
                    onClick={handleBookingsClick}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-black cursor-pointer",
                      isActive
                        ? "bg-[var(--primary-skyblue)] text-white hover:bg-[var(--primary-skyblue)]/90 hover:text-white"
                        : "text-muted-foreground",
                      collapsed && "justify-center px-2",
                    )}
                    title={collapsed ? item.label : undefined}>
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="truncate flex-1 text-left">
                          {item.label}
                        </span>
                      </>
                    )}
                  </button>

                  {!collapsed && isBookingsOpen && (
                    <div className="relative ml-5 pl-4 space-y-4 pt-2">
                      {/* Vertical line background */}
                      <div className="absolute left-[-4px] top-[14px] bottom-[0px] w-[2px] bg-gray-200" />

                      {item.children.map((child, childIndex) => {
                        const isChildActive = pathname === child.href;
                        return (
                          <div
                            key={childIndex}
                            className="relative flex items-center">
                            {/* Dot on the line */}
                            <div
                              className={cn(
                                "absolute left-[-24px] w-2.5 h-2.5 rounded-full border-2 z-10",
                                isChildActive
                                  ? "bg-[var(--primary-skyblue)] border-[var(--primary-skyblue)]"
                                  : "bg-gray-400 border-gray-400",
                              )}
                            />

                            <Link
                              href={child.href}
                              onClick={onLinkClick}
                              className={cn(
                                "flex items-center gap-3 text-sm font-medium transition-colors hover:text-black ml-1",
                                isChildActive
                                  ? "text-[var(--primary-skyblue)]"
                                  : "text-gray-500",
                              )}>
                              <child.icon
                                className={cn(
                                  "h-4 w-4 shrink-0",
                                  isChildActive
                                    ? "text-[var(--primary-skyblue)]"
                                    : "text-gray-500",
                                )}
                              />
                              <span className="truncate">{child.label}</span>
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={index}
                href={item.href}
                onClick={onLinkClick}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-black",
                  pathname === item.href
                    ? "bg-[var(--primary-skyblue)] text-white hover:bg-[var(--primary-skyblue)]/90 hover:text-white"
                    : "text-muted-foreground",
                  collapsed && "justify-center px-2",
                )}
                title={collapsed ? item.label : undefined}>
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={cn(
                          "ml-auto flex h-5 w-5 items-center justify-center rounded bg-[var(--primary-skyblue)] text-xs text-white",
                          pathname === item.href
                            ? "bg-white text-[var(--primary-skyblue)]"
                            : "bg-[var(--primary-skyblue)] text-xs text-white",
                        )}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 space-y-4">
        {!collapsed && (
          <div className="relative rounded-xl overflow-hidden transition-all duration-300 group  md:!h-[190px] xl:h-[242px] w-full z-[5000]">
            <div className="absolute inset-0 z-0">
              <Image
                src={sidebarImage}
                alt="Upgrade background"
                fill
                priority
                loading="eager"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />

              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(0, 142, 255, 0.6) 0%, rgba(185, 224, 255, 0) 100%)",
                }}
              />
            </div>
            <div className="relative z-10 flex flex-col justify-between h-full px-4 py-4 xl:py-6">
              <div className="space-y-1 text-center">
                <h4 className=" text-white text-sm xl:text-base">
                  Enhance Your
                </h4>
                <h3 className=" font-bold text-white/90 text-base xl:text-lg">
                  Traveli Experience!
                </h3>
              </div>
              {/* <button className="bg-white text-black text-[10px] xl:text-xs font-bold py-2 xl:py-3 px-4 rounded-lg w-full hover:bg-purple-50 transition-colors shadow-sm mt-auto">
                Upgrade Now
              </button> */}
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 px-3 py-2 w-full text-sm font-medium hover:bg-red-50 rounded-lg transition-colors text-muted-foreground cursor-pointer",
            collapsed && "justify-center",
          )}
          title={collapsed ? "Logout" : undefined}>
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "hidden border-r md:block h-screen transition-all duration-300 ease-in-out relative z-[5000]",
        collapsed ? "w-[70px]" : "w-64",
      )}>
      <SidebarContent collapsed={collapsed} />

      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-6 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-accent z-50"
        onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden mr-2">
          <Menu className="h-5 w-5 z-[6000]" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-72 z-[6000]">
        <SidebarContent onLinkClick={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
