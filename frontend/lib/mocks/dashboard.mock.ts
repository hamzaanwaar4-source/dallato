import { DashboardData } from '@/lib/types/dashboard';

export const MOCK_DATA: DashboardData = {
  stats: [
    {
      id: 'booking',
      title: 'Total Booking',
      value: '24',
      change: '+12%',
      trend: 'up',
      type: 'quotes'
    },
    {
      id: 'clients',
      title: 'Clients Contacted',
      value: '156',
      change: '-1.45%',
      trend: 'down',
      type: 'clients'
    },
    {
      id: 'conversion',
      title: 'Quote Conversion Tracker',
      value: '$47.2K',
      change: '+23%',
      trend: 'up',
      type: 'revenue'
    },
    {
      id: 'earnings',
      title: 'Total Earnings',
      value: '12',
      change: '+3',
      trend: 'up',
      type: 'departures'
    }
  ],
  tasks: [
    {
      id: '1',
      title: 'Sarah Johnson',
      subtitle: 'Call about payment',
      time: '10:00 AM',
      type: 'call',
      status: 'pending'
    },
    {
      id: '2',
      title: 'Michael Chen',
      subtitle: 'Waiting for budget confirmation',
      time: '11:30 AM',
      type: 'message',
      status: 'pending'
    },
    {
      id: '3',
      title: 'Emma Williams',
      subtitle: 'Update Paris quote',
      time: '2:30 PM',
      type: 'task',
      status: 'pending'
    },
    {
      id: '4',
      title: 'David Martinez',
      subtitle: 'Tokyo departure tomorrow',
      time: '3:00 PM',
      type: 'alert',
      status: 'pending'
    }
  ],
  recommendations: [
    {
      id: '1',
      name: 'Michael Chen',
      action: 'Private Airport Transfer',
      price: '$145',
      probability: 88,
      reason: 'Family with 2 children, 4 large bags',
      image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: '2',
      name: 'Emma Williams',
      action: 'Seine River Dinner Cruise',
      price: '$280',
      probability: 95,
      reason: 'Anniversary trip, romantic experiences preferred',
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: '3',
      name: 'David Martinez',
      action: 'Travel Insurance Package',
      price: '$189',
      probability: 65,
      reason: 'International trip with $5,000 total value',
      image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: '4',
      name: 'Sarah Johnson',
      action: 'Luxury Spa Day',
      price: '$350',
      probability: 72,
      reason: 'Solo traveler, wellness focus',
      image: 'https://images.unsplash.com/photo-1544161515-4af6b1d462c2?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: '5',
      name: 'Michael Chen',
      action: 'Tokyo City Tour',
      price: '$120',
      probability: 80,
      reason: 'First time in Tokyo, cultural interest',
      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=400'
    }
  ],
  alerts: [
    {
      id: '1',
      title: 'Quote #Q-2847 expires in 24 hours',
      subtitle: 'Sarah Johnson',
      type: 'urgent'
    },
    {
      id: '2',
      title: 'Outstanding balance $2,400',
      subtitle: 'Michael Chen',
      type: 'urgent'
    },
    {
      id: '3',
      title: 'Passport expires in 2 months',
      subtitle: 'Emma Williams',
      type: 'warning'
    },
    {
      id: '4',
      title: 'Hotel rate update for Bali packages',
      type: 'info'
    }
  ],
  conversations: [
    {
      id: '1',
      name: 'Sarah Johnson',
      location: 'Paris, France',
      status: 'Pricing',
      progress: 75,
      lastMessage: '5 min ago',
      avatarColor: 'bg-pink-200'
    },
    {
      id: '2',
      name: 'Michael Chen',
      location: 'Tokyo, Japan',
      status: 'Itinerary',
      progress: 45,
      lastMessage: '25 min ago',
      avatarColor: 'bg-blue-200'
    },
    {
      id: '3',
      name: 'Emma Williams',
      location: 'Bali, Indonesia',
      status: 'Chat',
      progress: 20,
      lastMessage: '1 hour ago',
      avatarColor: 'bg-yellow-200'
    },
    {
      id: '4',
      name: 'David Martinez',
      location: 'Sydney, Australia',
      status: 'Confirmation',
      progress: 90,
      lastMessage: '2 hours ago',
      avatarColor: 'bg-green-200'
    }
  ],
  quotes: [
    {
      id: '1',
      initial: "S",
      name: "Sarah Johnson",
      location: "Paris, France",
      status: "Pricing",
      percentage: 75,
      lastMessage: "5 min ago",
      color: "bg-[var(--primary-skyblue)]"
    },
    {
      id: '2',
      initial: "M",
      name: "Michael Chen",
      location: "Tokyo, Japan",
      status: "Itinerary",
      percentage: 45,
      lastMessage: "23 min ago",
      color: "bg-[var(--primary-skyblue)]"
    },
    {
      id: '3',
      initial: "E",
      name: "Emma Williams",
      location: "Bali, Indonesia",
      status: "Chat",
      percentage: 20,
      lastMessage: "1 hour ago",
      color: "bg-[var(--primary-skyblue)]"
    },
    {
      id: '4',
      initial: "D",
      name: "David Martinez",
      location: "Sydney, Australia",
      status: "Confirmation",
      percentage: 90,
      lastMessage: "2 hours ago",
      color: "bg-[var(--primary-skyblue)]"
    }
  ],
  todos: [
    { 
      id: "1", 
      task: "Quote #Q-2847 expires in 24 hours",
      client: "Sarah Johnson", 
      tag: "Pricing - Pending Decision",
      tagColor: "bg-blue-100 text-blue-700",
      progress: 60,
      progressColor: "bg-green-500",
      nextAction: "Follow up on quote acceptance",
      time: "10:00 AM",
      urgent: true
    },
    { 
      id: "2", 
      task: "Update Paris quote",
      client: "Emma Williams", 
      tag: "Itinerary - Modification Request",
      tagColor: "bg-blue-100 text-blue-700",
      progress: 45,
      progressColor: "bg-yellow-500",
      nextAction: "Revise itinerary with dinner cruise",
      time: "2:00 PM",
      urgent: false
    },
    { 
      id: "3", 
      task: "Outstanding balance $2,400",
      client: "Michael Chen", 
      tag: "Payment - Awaiting Deposit",
      tagColor: "bg-blue-100 text-blue-700",
      progress: 60,
      progressColor: "bg-[var(--primary-skyblue)]",
      nextAction: "Send payment reminder email",
      time: "11:30 AM",
      urgent: true
    },
    { 
      id: "4", 
      task: "Tokyo departure tomorrow",
      client: "David Martinez", 
      tag: "Departure - Final Checklist",
      tagColor: "bg-blue-100 text-blue-700",
      progress: 90,
      progressColor: "bg-green-500",
      nextAction: "Send final travel documents",
      time: "3:30 PM",
      urgent: false
    },
  ],
  revenueData: [
    // This Month (December 2025)
    { name: 'Dec 1', value: 400, date: '2025-12-01' },
    { name: 'Dec 5', value: 350, date: '2025-12-05' },
    { name: 'Dec 10', value: 420, date: '2025-12-10' },
    { name: 'Dec 15', value: 280, date: '2025-12-15' },
    { name: 'Dec 20', value: 635, date: '2025-12-20' },
    { name: 'Dec 25', value: 450, date: '2025-12-25' },
    { name: 'Dec 30', value: 580, date: '2025-12-30' },

    // Last Month (November 2025)
    { name: 'Nov 1', value: 300, date: '2025-11-01' },
    { name: 'Nov 5', value: 450, date: '2025-11-05' },
    { name: 'Nov 10', value: 320, date: '2025-11-10' },
    { name: 'Nov 15', value: 500, date: '2025-11-15' },
    { name: 'Nov 20', value: 400, date: '2025-11-20' },
    { name: 'Nov 25', value: 380, date: '2025-11-25' },
    { name: 'Nov 30', value: 600, date: '2025-11-30' },

    // 3 Months Ago (September 2025)
    { name: 'Sep 1', value: 200, date: '2025-09-01' },
    { name: 'Sep 15', value: 400, date: '2025-09-15' },
    { name: 'Sep 30', value: 350, date: '2025-09-30' },
  ],
  destinationsData: [
    { name: 'Tokyo, Japan', value: 35, participants: 2458, color: '#3B82F6' },
    { name: 'Sydney, Australia', value: 28, participants: 2458, color: '#60A5FA' },
    { name: 'New York, USA', value: 12, participants: 2458, color: '#bbb7b7ff' },
    { name: 'Sydney, Australia', value: 25, participants: 2458, color: '#e3dbdbff' },
  ],
  heatMapData: [
    { name: "Paris, France", coordinates: [2.3522, 48.8566], value: 56 },
    { name: "Tokyo, Japan", coordinates: [139.6503, 35.6762], value: 64 },
    { name: "Ubud, Bali, Indonesia", coordinates: [115.1889, -8.4095], value: 28 },
    { name: "Sydney, NSW, Australia", coordinates: [151.2093, -33.8688], value: 34 },
    { name: "New York City, NY, USA", coordinates: [-74.0060, 40.7128], value: 42 },
    { name: "London, UK", coordinates: [-0.1276, 51.5074], value: 38 },
    { name: "Dubai, UAE", coordinates: [55.2708, 25.2048], value: 45 },
    { name: "Mumbai, Maharashtra, India", coordinates: [72.8777, 19.0760], value: 64 },
    { name: "Berlin, Germany", coordinates: [13.4050, 52.5200], value: 31 },
    { name: "Rome, Italy", coordinates: [12.4964, 41.9028], value: 49 },
  ],

  }

export const AGENCY_MOCK_DATA: DashboardData = {
  ...MOCK_DATA,
  departures: undefined,
  stats: [
    {
      id: 'agency-revenue',
      title: 'Agency Revenue',
      value: '$245.8K',
      change: '+15%',
      trend: 'up',
      type: 'revenue'
    },
    {
      id: 'active-agents',
      title: 'Active Agents',
      value: '12',
      change: '+2',
      trend: 'up',
      type: 'clients'
    },
    {
      id: 'total-bookings',
      title: 'Total Agency Bookings',
      value: '156',
      change: '+8%',
      trend: 'up',
      type: 'quotes'
    },
    {
      id: 'agency-earnings',
      title: 'Agency Earnings',
      value: '$42.5K',
      change: '+12%',
      trend: 'up',
      type: 'departures'
    }
  ],
  topPerformers: [
    {
      id: '1',
      name: 'Michael Chen',
      metric: 'Highest Revenue',
      value: '$186,700',
      progress: 85,
      color: '#43ABFF'
    },
    {
      id: '2',
      name: 'Emily Rodriguez',
      metric: 'Most Bookings',
      value: '35 bookings',
      progress: 65,
      color: '#8B5CF6'
    },
    {
      id: '3',
      name: 'Sarah Martinez',
      metric: 'Best Conversion',
      value: '68% rate',
      progress: 75,
      color: '#10B981'
    },
    {
      id: '4',
      name: 'David Kim',
      metric: 'Fastest Response',
      value: '1.2h avg',
      progress: 45,
      color: '#F59E0B'
    }
  ]
};
