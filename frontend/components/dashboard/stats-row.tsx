import { DollarSign, Users, TrendingUp, Plane } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatItem } from "@/lib/types/dashboard";

interface StatsRowProps {
  stats: StatItem[];
}

const iconMap = {
  quotes: DollarSign,
  clients: Users,
  revenue: TrendingUp,
  departures: Plane,
};

const colorMap = {
  quotes: { color: "text-blue-500", bg: "bg-blue-50" },
  clients: { color: "text-green-500", bg: "bg-green-50" },
  revenue: { color: "text-purple-500", bg: "bg-purple-50" },
  departures: { color: "text-orange-500", bg: "bg-orange-50" },
};

export function StatsRow({ stats }: StatsRowProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const type = stat.type ?? "quotes";
        const Icon = iconMap[type];
        const colors = colorMap[type];
        // const Icon = iconMap[stat.type];
        // const colors = colorMap[stat.type];

        return (
          <Card key={stat.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className={`rounded-lg p-2 ${colors.bg}`}>
                <Icon className={`h-4 w-4 ${colors.color}`} />
              </div>
              <span
                className={`text-xs font-bold ${stat.trend === "up" ? "text-green-500" : "text-red-500"}`}
              >
                <TrendingUp className="h-4 w-4 text-green-500" />
                {stat.change}
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{stat.title}</p>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
