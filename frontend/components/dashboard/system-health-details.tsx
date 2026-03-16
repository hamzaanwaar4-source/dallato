"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Activity, 
  Cpu, 
  Database, 
  HardDrive, 
  Server, 
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SystemHealthData } from "@/lib/types/dashboard";
import { Skeleton } from "@/components/ui/skeleton";

interface SystemHealthDetailsProps {
  data?: SystemHealthData;
  history?: { time: string; cpu: number; mem: number }[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function SystemHealthDetails({ data, history = [], isLoading = false, onRefresh }: SystemHealthDetailsProps) {
  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Healthy":
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case "Warning":
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case "Critical":
        return <XCircle className="w-5 h-5 text-rose-500" />;
      default:
        return null;
    }
  };

  // Use provided history or fallback to empty
  const trendData = history.length > 0 ? history : [
    { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), cpu: data.cpu.usage_percent, mem: data.memory.percent }
  ];

  const resourceData = [
    { name: "CPU", value: data.cpu.usage_percent, color: "#0ea5e9" },
    { name: "Memory", value: data.memory.percent, color: "#8b5cf6" },
    { name: "Disk", value: data.disk.percent, color: "#10b981" },
  ];

  return (
    <Card className="col-span-full bg-white border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg font-bold">System Health Monitor</CardTitle>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-sm font-medium">
            {getStatusIcon(data.status)}
            <span className={
              data.status === "Healthy" ? "text-emerald-700" : 
              data.status === "Warning" ? "text-amber-700" : "text-rose-700"
            }>
              System {data.status}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* CPU Card */}
          <div className="p-4 rounded-xl bg-sky-50 border border-sky-100">
            <div className="flex items-center justify-between mb-2">
              <Cpu className="w-5 h-5 text-sky-600" />
              <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">CPU Usage</span>
            </div>
            <div className="text-2xl font-bold text-sky-900">{data.cpu.usage_percent}%</div>
            <div className="text-xs text-sky-700 mt-1">{data.cpu.cores} Cores @ {data.cpu.frequency_mhz.toFixed(0)} MHz</div>
          </div>

          {/* Memory Card */}
          <div className="p-4 rounded-xl bg-violet-50 border border-violet-100">
            <div className="flex items-center justify-between mb-2">
              <HardDrive className="w-5 h-5 text-violet-600" />
              <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">Memory</span>
            </div>
            <div className="text-2xl font-bold text-violet-900">{data.memory.percent}%</div>
            <div className="text-xs text-violet-700 mt-1">{formatBytes(data.memory.used)} / {formatBytes(data.memory.total)}</div>
          </div>

          {/* Database Card */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
            <div className="flex items-center justify-between mb-2">
              <Database className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Database</span>
            </div>
            <div className="text-2xl font-bold text-emerald-900">{data.database.status}</div>
            <div className="text-xs text-emerald-700 mt-1">Engine: {data.database.engine}</div>
          </div>

          {/* Uptime Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-slate-600" />
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Uptime</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{formatUptime(data.uptime)}</div>
            <div className="text-xs text-slate-700 mt-1">Since last reboot</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trend Chart */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Server className="w-4 h-4" />
                Resource Utilization Trend
              </h4>
              {onRefresh && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onRefresh}
                  disabled={isLoading}
                  className="h-8 px-2 text-slate-500 hover:text-primary"
                >
                  <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                  Refresh
                </Button>
              )}
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} unit="%" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="cpu" name="CPU %" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorCpu)" strokeWidth={2} />
                  <Area type="monotone" dataKey="mem" name="Memory %" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorMem)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* System Info */}
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-4">System Information</h4>
            <div className="space-y-4">
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Operating System</span>
                <span className="text-sm font-medium text-slate-900">{data.system.os} {data.system.os_release}</span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Python Version</span>
                <span className="text-sm font-medium text-slate-900">{data.system.python_version}</span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Processor</span>
                <span className="text-sm font-medium text-slate-900 truncate">{data.system.processor}</span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Disk Usage</span>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-emerald-500 h-1.5 rounded-full" 
                    style={{ width: `${data.disk.percent}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-slate-500">{formatBytes(data.disk.used)} used</span>
                  <span className="text-[10px] text-slate-500">{data.disk.percent}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
