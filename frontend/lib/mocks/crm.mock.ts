import { Users, TrendingUp, UserCheck, UserPlus, Bell, Settings, FileText } from "lucide-react";
import { CRMStat, CRMActivity } from "../types/crm";

export const CRM_STATS_MOCK: CRMStat[] = [
  {
    label: "Total Clients",
    value: "1,248",
    trend: "+28% this month",
    icon: Users,
    color: "text-[#43ABFF]",
  },
  {
    label: "New Clients",
    value: "87",
    subtext: "This month",
    icon: TrendingUp,
    color: "text-[#10B981]",
  },
  {
    label: "High-Value",
    value: "142",
    subtext: "AI-Identified",
    icon: UserCheck,
    color: "text-[#8B5CF6]",
  },
];

export const CRM_ACTIVITIES_MOCK: CRMActivity[] = [
  {
    id: "1",
    type: 'client_added',
    message: "Agent Sarah added new client - David Johnson",
    time: "5 min ago",
    icon: UserPlus,
    iconBg: "bg-[#E6F9F1]",
    iconColor: "text-[#00B69B]",
  },
  {
    id: "2",
    type: 'visa_reminder',
    message: "Visa reminder sent to James Parker",
    time: "7 min ago",
    icon: Bell,
    iconBg: "bg-[#FFF8E6]",
    iconColor: "text-[#FFA70B]",
  },
  {
    id: "3",
    type: 'preference_updated',
    message: "Michael updated preferences for Emma Wilson",
    time: "9 min ago",
    icon: TrendingUp,
    iconBg: "bg-[#E6F4FF]",
    iconColor: "text-[#43ABFF]",
  },
  {
    id: "4",
    type: 'visa_reminder',
    message: "Visa reminder sent to James Parker",
    time: "10 min ago",
    icon: Bell,
    iconBg: "bg-[#FFF8E6]",
    iconColor: "text-[#FFA70B]",
  },
  {
    id: "5",
    type: 'client_added',
    message: "Agent Sarah added new client - David Johnson",
    time: "12 min ago",
    icon: UserPlus,
    iconBg: "bg-[#E6F9F1]",
    iconColor: "text-[#00B69B]",
  },
  {
    id: "6",
    type: 'preference_updated',
    message: "Michael updated preferences for Emma Wilson",
    time: "14 min ago",
    icon: TrendingUp,
    iconBg: "bg-[#E6F4FF]",
    iconColor: "text-[#43ABFF]",
  },
  {
    id: "7",
    type: 'travel_notes',
    message: "Emily added travel notes for Olivia Brown",
    time: "17 min ago",
    icon: FileText,
    iconBg: "bg-[#F3E8FF]",
    iconColor: "text-[#A855F7]",
  },
];
