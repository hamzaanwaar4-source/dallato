import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ActivityItem } from "@/lib/types/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2 } from "lucide-react";

interface RecentActivityProps {
  activities: ActivityItem[];
  isLoading?: boolean;
}

export function RecentActivity({
  activities,
  isLoading = false,
}: RecentActivityProps) {
  if (isLoading) {
    return (
      <Card className="h-[400px] flex flex-col">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-36" />
        </CardHeader>
        <CardContent className="flex-1 space-y-4 mt-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[400px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium mb-5">
          Recent Activity
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto pr-2">
        {activities.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mb-3 text-gray-300" />
            <p className="text-sm font-medium">No recent activity</p>
            <p className="text-xs">Activity will appear here once actions occur</p>
          </div>
        ) : (
          <div className="space-y-2 mt-3 pr-1">
            {activities.map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-3 text-sm p-3 rounded-xl transition-all duration-200 hover:bg-white hover:shadow-sm border border-transparent hover:border-blue-100 group"
              >
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="bg-blue-50 text-blue-600 text-xs font-semibold group-hover:bg-blue-100 transition-colors">
                    {activity.avatar}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="leading-snug">
                    <span className="font-semibold text-gray-900 mr-1">
                      {activity.user.toUpperCase()}
                    </span>
                    <span className="text-gray-600 lowercase first-letter:capitalize">
                      {activity.action}
                    </span>
                    {activity.target && (
                      <span className="font-medium text-blue-600 ml-1">
                        {activity.target}
                      </span>
                    )}
                  </p>

                  <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
