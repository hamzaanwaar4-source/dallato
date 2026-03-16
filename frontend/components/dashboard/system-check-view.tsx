"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Database,
  CheckCircle2,
  AlertCircle,
  XCircle
} from "lucide-react";
import { SystemHealthDetails } from "@/components/dashboard/system-health-details";
import { fetchSystemHealth } from "@/lib/api/dashboard.api";
import { SystemHealthData } from "@/lib/types/dashboard";
import { Skeleton } from "@/components/ui/skeleton";

export function SystemCheckView() {
  const [healthData, setHealthData] = useState<SystemHealthData | undefined>(undefined);
  const [history, setHistory] = useState<{ time: string; cpu: number; mem: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchSystemHealth();
        setHealthData(data);
        
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setHistory(prev => {
          const newPoint = { 
            time: timestamp, 
            cpu: data.cpu.usage_percent, 
            mem: data.memory.percent 
          };
          // Keep last 20 points
          const updated = [...prev, newPoint].slice(-20);
          return updated;
        });
      } catch (error) {
        console.error("Failed to fetch system health:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Healthy":
        return CheckCircle2;
      case "Warning":
        return AlertCircle;
      case "Critical":
        return XCircle;
      default:
        return Activity;
    }
  };

  const statsItems = healthData ? [
    {
      title: "System Status",
      value: healthData.status,
      icon: getStatusIcon(healthData.status),
      color: healthData.status === "Healthy" ? "text-emerald-500" : healthData.status === "Warning" ? "text-amber-500" : "text-rose-500"
    },
    {
      title: "CPU Usage",
      value: `${healthData.cpu.usage_percent}%`,
      icon: Cpu,
      color: "text-[var(--primary-skyblue)]"
    },
    {
      title: "Memory Usage",
      value: `${healthData.memory.percent}%`,
      icon: HardDrive,
      color: "text-[var(--primary-skyblue)]"
    },
    {
      title: "Disk Usage",
      value: `${healthData.disk.percent}%`,
      icon: Database,
      color: "text-[var(--primary-skyblue)]"
    }
  ] : [];

  return (
    <div className="space-y-8 p-6 pb-35">
      <div>
        {/* <h1 className="text-3xl font-bold tracking-tight">System Check</h1> */}
        <p className="text-muted-foreground mt-2">
          Monitor platform infrastructure and service health
        </p>
      </div>

      {/* Stats Row - Pattern from AgentStats */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {isLoading && !healthData ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-[#EFF8FF] border-none shadow-none rounded-xl">
              <CardContent className="p-3 sm:p-4 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <Skeleton className="h-8 w-20 ml-3" />
                </div>
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))
        ) : (
          statsItems.map((item, index) => (
            <Card key={index} className="bg-[#EFF8FF] border-none shadow-none rounded-xl">
              <CardContent className="p-3 sm:p-4 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shrink-0">
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 leading-none ml-3">
                    {item.value}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-tight">
                  {item.title}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Detailed View */}
      <SystemHealthDetails 
        data={healthData} 
        history={history}
        isLoading={isLoading} 
        onRefresh={() => {
          // Trigger the same loadData logic
          const loadData = async () => {
            try {
              setIsLoading(true);
              const data = await fetchSystemHealth();
              setHealthData(data);
              
              const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              setHistory(prev => {
                const newPoint = { 
                  time: timestamp, 
                  cpu: data.cpu.usage_percent, 
                  mem: data.memory.percent 
                };
                return [...prev, newPoint].slice(-20);
              });
            } catch (error) {
              console.error("Failed to fetch system health:", error);
            } finally {
              setIsLoading(false);
            }
          };
          loadData();
        }}
      />
    </div>
  );
}
