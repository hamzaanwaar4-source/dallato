'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Globe, CheckCircle2, AlertCircle, SquarePen, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getManagedSuppliers } from '@/lib/api/suppliers.api';
import { ApiManagedSupplier } from '@/lib/types/supplier';
import { toast } from 'sonner';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<ApiManagedSupplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const data = await getManagedSuppliers();
        setSuppliers(data);
      } catch (error) {
        console.error("Failed to fetch suppliers:", error);
        toast.error("Failed to load suppliers");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  // Calculate stats from suppliers data
  const mostUsedSupplier = suppliers.reduce((max, supplier) => 
    supplier.bookings_count > (max?.bookings_count || 0) ? supplier : max
  , suppliers[0]);

  const bestCommissionSupplier = suppliers.reduce((max, supplier) => 
    parseFloat(supplier.commission) > parseFloat(max?.commission || '0') ? supplier : max
  , suppliers[0]);

  const fastestGrowingSupplier = suppliers.reduce((max, supplier) => 
    parseFloat(supplier.trend_percent) > parseFloat(max?.trend_percent || '0') ? supplier : max
  , suppliers[0]);

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-8 bg-white min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <p className="text-[#64748B] text-sm sm:text-base mt-1">
            Manage supplier integrations, API connections, and commission rates
          </p>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-[16px] border border-[#E2E8F0] overflow-hidden shadow-sm">
        <Table className="min-w-[1000px]">
          <TableHeader>
            <TableRow className="border-b border-[#E2E8F0] bg-[#F7F8F8] hover:bg-[#F7F8F8]">
              <TableHead className="px-6 py-5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider h-auto">Supplier</TableHead>
              {/* <TableHead className="px-6 py-5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider h-auto">Type</TableHead> */}
              <TableHead className="px-6 py-5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider h-auto">API Status</TableHead>
              {/* <TableHead className="px-6 py-5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider h-auto">Commission</TableHead> */}
              <TableHead className="px-6 py-5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider h-auto">Bookings</TableHead>
              <TableHead className="px-6 py-5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider h-auto">Usage %</TableHead>
              <TableHead className="px-6 py-5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider h-auto">Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-[#E2E8F0]">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-[#E2E8F0]">
                  <TableCell className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-5"><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell className="px-6 py-5"><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                  <TableCell className="px-6 py-5"><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell className="px-6 py-5"><Skeleton className="h-5 w-12" /></TableCell>
                  {/* <TableCell className="px-6 py-5"><Skeleton className="h-5 w-12" /></TableCell> */}
                  {/* <TableCell className="px-6 py-5"><Skeleton className="h-5 w-12" /></TableCell> */}
                </TableRow>
              ))
            ) : suppliers.length > 0 ? (
              suppliers.map((supplier, index) => (
                <TableRow key={index} className="hover:bg-gray-50/50 transition-colors border-[#E2E8F0]">
                  <TableCell className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#43ABFF]">
                        <Globe className="w-5 h-5" />
                      </div>
                      <span className="text-[15px] font-bold text-[#0F172A]">{supplier.supplier_name}</span>
                    </div>
                  </TableCell>
                  {/* <TableCell className="px-6 py-5">
                    <span className="text-[13px] font-medium text-[#64748B]">{supplier.supplier_type}</span>
                  </TableCell> */}
                  <TableCell className="px-6 py-5">
                    {supplier.api_status === 'Active' ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCFCE7] text-[#166534] text-[13px] font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Active
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEE2E2] text-[#991B1B] text-[13px] font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Error
                      </div>
                    )}
                  </TableCell>
                  {/* <TableCell className="px-6 py-5">
                    <span className="text-[15px] font-bold text-[#0F172A]">{parseFloat(supplier.commission).toFixed(2)}%</span>
                  </TableCell> */}
                  <TableCell className="px-6 py-5">
                    <span className="text-[15px] font-medium text-[#64748B]">{supplier.bookings_count}</span>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <span className="text-[15px] font-bold text-[#0F172A]">{parseFloat(supplier.usage_percent).toFixed(2)}%</span>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <span className="text-[15px] font-bold text-[#10B981]">+{parseFloat(supplier.trend_percent).toFixed(0)}%</span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="px-6 py-8 text-center text-[#64748B]">
                  <Clock className="h-8 w-8 mb-2 opacity-20 text-center mx-auto" />
                  No suppliers available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary Cards */}
      {!isLoading && suppliers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Most Used */}
          {/* <Card className="p-4 sm:p-6 border !border-[var(--primary-skyblue)]/100 rounded-[16px] shadow-sm bg-[var(--primary-skyblue)]/10 overflow-hidden">
            <p className="text-[13px] font-bold text-[#0F172A] mb-4">Most Used</p>
            <h3 
              className="text-[22px] sm:text-[28px] lg:text-[32px] font-bold text-[var(--primary-skyblue)] mb-1 truncate"
              title={mostUsedSupplier?.supplier_name}
            >
              {mostUsedSupplier?.supplier_name || 'N/A'}
            </h3>
            <p className="text-[14px] text-[#64748B] truncate">
              {mostUsedSupplier?.bookings_count || 0} bookings
            </p>
          </Card> */}

          {/* Best Commission */}
          {/* <Card className="p-4 sm:p-6 border !border-[var(--primary-skyblue)]/100 rounded-[16px] shadow-sm bg-[var(--primary-skyblue)]/10 overflow-hidden">
            <p className="text-[13px] font-bold text-[#0F172A] mb-4">Best Commission</p>
            <h3 
              className="text-[22px] sm:text-[28px] lg:text-[32px] font-bold text-[#10B981] mb-1 truncate"
              title={bestCommissionSupplier?.supplier_name}
            >
              {bestCommissionSupplier?.supplier_name || 'N/A'}
            </h3>
            <p className="text-[14px] text-[#64748B] truncate">
              {bestCommissionSupplier ? parseFloat(bestCommissionSupplier.commission).toFixed(2) : '0'}% commission
            </p>
          </Card> */}

          {/* Fastest Growing */}
          {/* <Card className="p-4 sm:p-6 border !border-[var(--primary-skyblue)]/100 rounded-[16px] shadow-sm bg-[var(--primary-skyblue)]/10 overflow-hidden">
            <p className="text-[13px] font-bold text-[#0F172A] mb-4">Fastest Growing</p>
            <h3 
              className="text-[22px] sm:text-[28px] lg:text-[32px] font-bold text-[#8B5CF6] mb-1 truncate"
              title={fastestGrowingSupplier?.supplier_name}
            >
              {fastestGrowingSupplier?.supplier_name || 'N/A'}
            </h3>
            <p className="text-[14px] text-[#64748B] truncate">
              +{fastestGrowingSupplier ? parseFloat(fastestGrowingSupplier.trend_percent).toFixed(0) : '0'}% growth
            </p>
          </Card> */}
        </div>
      )}
    </div>
  );
}
