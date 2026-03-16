import {
  QuotesData,
  Quote,
  Supplier,
  Recommendation,
} from "@/lib/types/quotes";

export const QUOTES_STATS_MOCK: QuotesData = {
  stats: [
    {
      id: 1,
      title: "Total Quotes",
      value: "1,200",
      change: "+2.98%",
      trend: "up",
      iconName: "CalendarCheck",
    },
    {
      id: 2,
      title: "This Month",
      value: "48",
      change: "-1.45%",
      trend: "down",
      iconName: "UserRoundPlus",
    },
    {
      id: 3,
      title: "Confirmed",
      value: "18",
      change: "+3.75%",
      trend: "up",
      iconName: "CircleDollarSign",
    },
    {
      id: 4,
      title: "Conversion Rate",
      value: "37.5%",
      change: "+3.75%",
      trend: "up",
      iconName: "CircleDollarSign",
    },
  ],
};

export const QUOTES_MOCK: Quote[] = [
  {
    id: "Q-2847",
    clientName: "Sarah Johnson",
    destination: "Paris, France",
    price: "$6,200",
    status: "Booked",
    version: "v2",
    updatedAt: "2 hours ago",
    items: [
      {
        type: "Hotel",
        title: "Le Grand Hotel Paris",
        description: "5 nights, Deluxe Suite",
        price: 2400,
      },
      {
        type: "Flight",
        title: "Round Trip - JFK to CDG",
        description: "Economy Class, 2 passengers",
        price: 1800,
      },
      {
        type: "Transfer",
        title: "Private Airport Transfer",
        description: "Round trip",
        price: 180,
      },
      {
        type: "Tour",
        title: "Eiffel Tower & Seine Cruise",
        description: "2 adults",
        price: 240,
      },
      {
        type: "Insurance",
        title: "Travel Protection Plan",
        description: "Comprehensive coverage",
        price: 150,
      },
    ],
  },
  {
    id: "Q-2846",
    clientName: "Michael Chen",
    destination: "Tokyo, Japan",
    price: "$8,400",
    status: "Draft",
    version: "v1",
    updatedAt: "1 day ago",
    items: [
      {
        type: "Flight",
        title: "Round Trip - LAX to NRT",
        description: "Business Class",
        price: 4500,
      },
      {
        type: "Hotel",
        title: "Park Hyatt Tokyo",
        description: "7 nights, Park View Room",
        price: 3900,
      },
    ],
  },
  {
    id: "Q-2845",
    clientName: "Emma Williams",
    destination: "Bali, Indonesia",
    price: "$4,800",
    status: "Approved",
    version: "v3",
    updatedAt: "3 days ago",
    items: [
      {
        type: "Hotel",
        title: "Four Seasons Sayan",
        description: "5 nights, Riverfront Villa",
        price: 3500,
      },
      {
        type: "Tour",
        title: "Ubud Cultural Tour",
        description: "Full day private tour",
        price: 200,
      },
    ],
  },
  {
    id: "Q-2844",
    clientName: "David Martinez",
    destination: "Sydney, Australia",
    price: "$5,600",
    status: "Booked",
    version: "v1",
    updatedAt: "5 days ago",
    items: [
      {
        type: "Flight",
        title: "Round Trip - SFO to SYD",
        description: "Premium Economy",
        price: 2800,
      },
      {
        type: "Hotel",
        title: "Shangri-La Sydney",
        description: "6 nights, Harbour View",
        price: 2800,
      },
    ],
  },
];

export const SUPPLIERS_MOCK: Supplier[] = [
  {
    name: "Expedia",
    roomType: "Deluxe King Suite",
    price: "$1350",
    cancellation: "Non-refundable",
    status: "Available",
  },
  {
    name: "Booking.com",
    roomType: "Premium Ocean View",
    price: "$2300",
    cancellation: "Free until 72h",
    status: "Limited",
    tags: ["Left 2 left"],
  },
  {
    name: "Direct Hotel",
    roomType: "Deluxe Suite",
    price: "$2600",
    cancellation: "Free until 24h",
    status: "Available",
    isRecommended: true,
  },
  {
    name: "Hotels.com",
    roomType: "Executive King",
    price: "$2100",
    cancellation: "Free until 48h",
    status: "Available",
  },
  {
    name: "Agoda",
    roomType: "Deluxe Room",
    price: "$2300",
    cancellation: "Free until 48h",
    status: "Available",
  },
  {
    name: "TripAdvisor",
    roomType: "Premium Suite",
    price: "$2450",
    cancellation: "Partial refund",
    status: "Available",
  },
  {
    name: "Priceline",
    roomType: "King Suite",
    price: "$2150",
    cancellation: "Free until 48h",
    status: "Available",
  },
];

export const RECOMMENDATIONS_MOCK: Recommendation[] = [
  {
    icon: "Expedia",
    color: "border-yellow-400 bg-yellow-50",
    textColor: "text-yellow-700",
    text: "Unusually low - Non-refundable category. Recommend comparing cancellation terms.",
  },
  {
    icon: "Booking.com",
    color: "border-green-400 bg-green-50",
    textColor: "text-green-700",
    text: "Best commission + cancellation terms.",
  },
  {
    icon: "Hotels.com",
    color: "border-green-400 bg-green-50",
    textColor: "text-green-700",
    text: "Lowest refundable rate",
  },
  {
    icon: "TripAdvisor",
    color: "border-blue-400 bg-blue-50",
    textColor: "text-blue-700",
    text: "Price increased $150 in last 24h",
  },
];
