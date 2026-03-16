"use client"

import React, { useState, useEffect } from 'react'
import { Clock, ExternalLink } from 'lucide-react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getManagedSuppliers } from '@/lib/api/suppliers.api'
import { ApiManagedSupplier } from '@/lib/types/supplier'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function SupplierUsageTable() {
  const [data, setData] = useState<ApiManagedSupplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getManagedSuppliers();
        setData(response);
      } catch (error) {
        console.error("Failed to fetch supplier usage:", error);
        toast.error("Failed to load supplier usage");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleViewAll = () => {
    router.push('/manage-suppliers');
  };

  return (
    <Card className="border border-[#F1F5F9] shadow-sm rounded-[24px] overflow-hidden">
      <div className="p-6 flex items-center justify-between">
        <div>
          <h3 className="text-[18px] font-bold text-[#0F172A]">Supplier Usage Trends</h3>
          <p className="text-[#64748B] text-[13px]">Most utilized suppliers across all agents</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleViewAll}
          className="bg-[#F8F9FA] border-[#E2E8F0] text-[#0F172A] text-[12px] font-medium rounded-xl h-9"
        >
          View All Suppliers
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table className="w-full text-left">
          <TableHeader className="bg-[#F7F8F8] border-y border-[#F1F5F9]">
            <TableRow className="hover:bg-[#F7F8F8] border-none">
              <TableHead className="px-6 py-4 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider h-auto">Supplier</TableHead>
              <TableHead className="px-6 py-4 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider h-auto">Total Bookings</TableHead>
              <TableHead className="px-6 py-4 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider h-auto">Usage %</TableHead>
              <TableHead className="px-6 py-4 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider h-auto">Trend</TableHead>
              <TableHead className="px-6 py-4 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider h-auto">Distribution</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-[#F1F5F9]">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-[#F1F5F9]">
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4"><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell className="px-6 py-4"><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell className="px-6 py-4"><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell className="px-6 py-4"><Skeleton className="h-1.5 w-48 rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : data.length > 0 ? (
              data.map((item, index) => (
                <TableRow key={index} className="hover:bg-[#F8F9FA]/50 transition-colors border-[#F1F5F9]">
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#E0F2FE] flex items-center justify-center">
                        <ExternalLink className="w-4 h-4 text-[#0EA5E9]" />
                      </div>
                      <span className="text-[#0F172A] font-bold text-[14px]">{item.supplier_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-[#64748B] text-[14px] font-medium">{item.bookings_count}</TableCell>
                  <TableCell className="px-6 py-4 text-[#0F172A] font-bold text-[14px]">{parseFloat(item.usage_percent).toFixed(2)}%</TableCell>
                  <TableCell className="px-6 py-4">
                    <span className="text-[#10B981] font-bold text-[14px]">+{parseFloat(item.trend_percent).toFixed(0)}%</span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="w-48 h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#0EA5E9] rounded-full" 
                        style={{ width: `${parseFloat(item.usage_percent)}%` }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="px-6 py-8 text-center text-[#64748B]">
                  <Clock className="h-8 w-8 mb-2 opacity-20 text-center mx-auto" />
                  No data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
