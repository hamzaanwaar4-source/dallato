"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TopPerformerItem } from "@/lib/types/dashboard"
import { TrendingUp, ChevronDown } from "lucide-react"
import { fetchTopPerformingAgents } from "@/lib/api/dashboard.api"
import { authStore } from "@/lib/auth-store"
import { Clock } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface TopPerformersProps {
  performers?: TopPerformerItem[];
  isLoading?: boolean;
}

export function TopPerformers({ performers: initialPerformers = [], isLoading: initialLoading = false }: TopPerformersProps) {
  const [performers, setPerformers] = useState<TopPerformerItem[]>(initialPerformers);
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [filter, setFilter] = useState<"weekly" | "monthly" | "overall">("monthly");
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const user = authStore.getUser();
    const userRole = user?.role || null;
    setRole(userRole);

    // If not admin, use initial props immediately
    if (userRole !== "Agency Admin") {
      setPerformers(initialPerformers);
      setIsLoading(initialLoading);
    }
  }, [initialPerformers, initialLoading]);

  useEffect(() => {
    if (role === "Agency Admin") {
      const loadPerformers = async () => {
        setIsLoading(true);
        try {
          const data = await fetchTopPerformingAgents(filter);
          setPerformers(data);
        } catch (error) {
          console.error("Failed to fetch top performers:", error);
        } finally {
          setIsLoading(false);
        }
      };
      loadPerformers();
    }
  }, [filter, role]);

  if (isLoading) {
    return (
      <Card className="border shadow-sm rounded-2xl flex flex-col mb-10 p-2 pb-20">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#000E19]" />
            <Skeleton className="h-6 w-36" />
          </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-4 h-full">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border shadow-sm rounded-2xl flex flex-col mb-10 p-2 pb-6 min-h-[250px]">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[#000E19]" />
          <CardTitle className="text-base font-bold text-[#000E19]">Top Performers</CardTitle>
        </div>
        {role === "Agency Admin" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-[#757D83] hover:bg-gray-100 gap-1 capitalize">
                {filter} <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem className="text-xs font-medium capitalize" onClick={() => setFilter("weekly")}>Weekly</DropdownMenuItem>
              <DropdownMenuItem className="text-xs font-medium capitalize" onClick={() => setFilter("monthly")}>Monthly</DropdownMenuItem>
              <DropdownMenuItem className="text-xs font-medium capitalize" onClick={() => setFilter("overall")}>Overall</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto pr-2 pb-2 h-full flex flex-col justify-center items-center">
        <div className="space-y-4 h-full w-full">
          {performers.length > 0 ? (
            performers.map((performer) => (
              <div key={performer.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-bold text-[#000E19]">{performer.name}</p>
                    <p className="text-[10px] text-[#757D83] font-medium">{performer.metric}</p>
                  </div>
                  <p className="text-[13px] font-bold" style={{ color: performer.color }}>
                    {performer.value}
                  </p>
                </div>
                <div className="h-1.5 w-full bg-[#F2F4F7] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${performer.progress}%`,
                      backgroundColor: performer.color
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-xs text-gray-500 font-medium h-full">
              <Clock className="h-8 w-8 mb-2 opacity-20 text-center mx-auto" />
              No performance data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
