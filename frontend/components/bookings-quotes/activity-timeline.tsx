import { cn } from "@/lib/utils"
import { ActivityLog } from "@/lib/types/bookings-quotes"

interface ActivityTimelineProps {
  activities: ActivityLog[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-[#000E19]">Quote Activity Timeline</h3>
      <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
        {activities.map((activity, index) => (
          <div key={activity.id} className="relative flex items-center justify-between">
            <div className="flex items-center">
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shadow shrink-0 z-10",
                activity.status === 1 ? "bg-[#00B69B] text-white" : "bg-[#43ABFF] text-white"
              )}>
                <span className="text-sm font-bold">{index + 1}</span>
              </div>
              <div className="ml-4 min-w-0 flex-1">
                <h4 className="text-sm font-bold text-[#000E19] break-words">{activity.action}</h4>
                <p className="text-xs text-gray-400 break-words">
                  {activity.time} {activity.user && `by ${activity.user}`}
                </p>
                {activity.description && (
                  <p className="text-xs text-gray-500 mt-1 break-words">{activity.description}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
