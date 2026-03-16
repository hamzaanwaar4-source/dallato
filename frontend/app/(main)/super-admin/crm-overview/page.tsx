"use client"

import { useEffect, useState } from 'react'
import { Clock, Users, TrendingUp, UserCheck, UserPlus, Bell, FileText, Briefcase, Plane, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { fetchSuperAdminCRMOverview } from '@/lib/api/dashboard.api'
import { cn } from '@/lib/utils'
import { Loader } from '@/components/ui/loader'

const getActionIcon = (message: string) => {
  const msg = message.toLowerCase();
  // if (msg.includes('quote')) {
  //   return { icon: FileText, bg: 'bg-[#E6F4FF]', color: 'text-[#43ABFF]' };
  // }
  // if (msg.includes('trip')) {
  //   return { icon: Briefcase, bg: 'bg-[#E6F9F1]', color: 'text-[#00B69B]' };
  // }
  // if (msg.includes('client')) {
  //   return { icon: UserPlus, bg: 'bg-[#F5F3FF]', color: 'text-[#8B5CF6]' };
  // }
  return { icon: Clock, bg: 'bg-[#F8F9FA]', color: 'text-[#64748B]' };
}

export default function SuperAdminCRMOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const overview = await fetchSuperAdminCRMOverview();
        setData(overview);
      } catch (error) {
        console.error("Failed to fetch Super Admin CRM overview:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Loader />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-[#64748B]">Failed to load CRM overview data.</p>
      </div>
    );
  }

  const stats = [
    {
      label: "Total Clients",
      value: data.total_clients.toLocaleString(),
      icon: Users,
      color: "text-[#43ABFF]",
      subtext: "System-wide registered"
    },
    {
      label: "New Clients",
      value: data.new_clients.toLocaleString(),
      subtext: "Added this month",
      icon: TrendingUp,
      color: "text-[#10B981]",
    },
    {
      label: "High-Value",
      value: data.high_value_clients.toLocaleString(),
      subtext: "Luxury Style",
      icon: UserCheck,
      color: "text-[#8B5CF6]",
    },
  ];

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-8 bg-white min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-[24px] font-bold text-[#0F172A]">CRM Overview</h1>
        <p className="text-[#64748B] text-sm sm:text-base">
          System-wide client relationship management insights for all agencies
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6 border border-[#E2E8F0] rounded-[16px] shadow-sm bg-[#F8F9FA] relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[13px] font-bold text-[#64748B]">{stat.label}</span>
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <div className="space-y-1">
              <h3 className="text-[28px] sm:text-[32px] font-bold text-[#0F172A]">{stat.value}</h3>
              <p className="text-[14px] text-[#64748B]">{stat.subtext}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent CRM Activity Section */}
      <div className="space-y-6">
        <h2 className="text-[18px] font-bold text-[#0F172A]">Recent System Activity</h2>
        
        <div className="space-y-3">
          {data.recent_activities.map((activity: any) => {
            const { icon: Icon, bg, color } = getActionIcon(activity.message);
            return (
              <div 
                key={activity.id} 
                className="flex items-center justify-between p-4 bg-[#F8F9FA] rounded-[12px] border border-transparent hover:border-[#E2E8F0] transition-all group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                    bg,
                    color
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] sm:text-[15px] font-medium text-[#0F172A] truncate">
                      {activity.message}
                    </p>
                    <p className="text-[12px] text-[#64748B]">
                      by {activity.performer_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4 text-[#64748B]">
                  <Clock className="w-4 h-4" />
                  <span className="text-[12px] sm:text-[13px] font-medium">
                    {new Date(activity.created_at).toLocaleDateString()} {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  )
}
