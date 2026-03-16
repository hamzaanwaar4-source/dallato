"use client"

import React from 'react'
import { DollarSign, Users, Calendar } from 'lucide-react'
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface StatCardProps {
  label: string;
  value?: string | number;
  isLoading?: boolean;
}

export function StatCard({ label, value, isLoading }: StatCardProps) {
  const Icon = label.includes('Revenue') ? DollarSign : 
               label.includes('Clients') ? Users : Calendar;

  if (isLoading) {
    return (
      <Card className="border-none shadow-none bg-[#E0F2FE]/40 rounded-[20px] p-5 flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-xl bg-white/50" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24 bg-white/50" />
          <div className="flex items-baseline gap-3">
            <Skeleton className="h-8 w-20 bg-white/50" />
            <Skeleton className="h-5 w-12 rounded-full bg-white/50" />
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="border-none shadow-none bg-[#E0F2FE]/40 rounded-[20px] p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
        <Icon className="w-6 h-6 text-[#0EA5E9]" />
      </div>
      <div className="flex-1">
        <p className="text-[#64748B] text-[13px] font-medium mb-1">{label}</p>
        <div className="flex items-baseline gap-3">
          <h3 className="text-[28px] font-bold text-[#0F172A]">{value}</h3>
          {/* {trend && (
            <Badge className="bg-white text-[#64748B] hover:bg-white border-none text-[11px] font-medium px-2 py-0.5 rounded-full">
              {trend}
            </Badge>
          )} */}
        </div>
      </div>
    </Card>
  )
}
