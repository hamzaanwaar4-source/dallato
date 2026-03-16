import { AnalyticsData } from "../types/analytics";

export const ANALYTICS_MOCK_DATA: AnalyticsData = {
  stats: [
    {
      label: "Avg Revenue/Agent",
      value: "$138K",
      trend: "+18% vs last month",
      icon: "dollar-sign",
      color: "#43ABFF"
    },
    {
      label: "Avg Clients/Agent",
      value: "24",
      trend: "+12% vs last month",
      icon: "users",
      color: "#43ABFF"
    },
    {
      label: "Total Bookings",
      value: "342",
      trend: "+24% vs last month",
      icon: "calendar",
      color: "#43ABFF"
    }
  ],
  leaderboard: [
    { id: "1", name: "Emily R.", revenue: 450200, rank: 1 },
    { id: "2", name: "James L.", revenue: 312500, rank: 2 },
    { id: "3", name: "Sophia K.", revenue: 198750, rank: 3 },
    { id: "4", name: "Michael B.", revenue: 158750, rank: 4 },
    { id: "5", name: "Olivia T.", revenue: 108750, rank: 5 }
  ],
  conversionRates: [
    { id: "1", name: "David K.", rate: 44, color: "#10B981" },
    { id: "2", name: "Emily R.", rate: 41, color: "#0EA5E9" },
    { id: "3", name: "Jessica T.", rate: 38, color: "#8B5CF6" },
    { id: "4", name: "Michael C.", rate: 36, color: "#F59E0B" },
    { id: "5", name: "Sarah M.", rate: 34, color: "#EF4444" }
  ],
  quoteTrends: {
    monthly: [
      { name: "Emily R.", quotes: 90 },
      { name: "Michael C.", quotes: 65 },
      { name: "Sarah M.", quotes: 55 },
      { name: "David K.", quotes: 45 },
      { name: "Jessica T.", quotes: 15 }
    ],
    weekly: [
      { name: "Emily R.", quotes: 25 },
      { name: "Michael C.", quotes: 18 },
      { name: "Sarah M.", quotes: 15 },
      { name: "David K.", quotes: 12 },
      { name: "Jessica T.", quotes: 5 }
    ]
  },
  revenueByDestination: [
    { name: "Paris, France", value: 45, color: "#0EA5E9" },
    { name: "Tokyo, Japan", value: 25, color: "#8B5CF6" },
    { name: "Maldives", value: 15, color: "#10B981" },
    { name: "Dubai, UAE", value: 10, color: "#F59E0B" },
    { name: "New York, USA", value: 5, color: "#EF4444" }
  ],
  supplierUsage: [
    {
      id: "1",
      supplier: "Booking.com",
      totalLeads: "345 bookings",
      usagePercent: 42,
      trend: "+12%",
      distribution: [40, 60, 45, 70, 55, 80, 65]
    },
    {
      id: "2",
      supplier: "Airbnb",
      totalLeads: "320 bookings",
      usagePercent: 55,
      trend: "+8%",
      distribution: [30, 50, 40, 60, 50, 70, 60]
    },
    {
      id: "3",
      supplier: "Expedia",
      totalLeads: "180 bookings",
      usagePercent: 38,
      trend: "+5%",
      distribution: [20, 40, 30, 50, 40, 60, 50]
    },
    {
      id: "4",
      supplier: "Hotels.com",
      totalLeads: "150 bookings",
      usagePercent: 25,
      trend: "+3%",
      distribution: [10, 30, 20, 40, 30, 50, 40]
    }
  ],
  topInsight: "David K. achieves highest conversion when responding within 30 minutes"
};
