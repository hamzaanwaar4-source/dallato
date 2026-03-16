import { Quote } from "../types/bookings-quotes";

export const QUOTES_MOCK: Quote[] = [
  {
    id: "1",
    quoteNumber: "Q-2847",
    clientName: "Sarah Johnson",
    destination: "Paris, France",
    value: "$6,200",
    status: "Sent",
    expiry: "2 days left",
    agentName: "Sarah M.",
    travelDates: "Dec 15-25, 2024",
    activityTimeline: [
      { id: "a1", action: "Quote Created", time: "Dec 5, 2024", user: "Sarah M.", status: 1 },
      { id: "a2", action: "Quote Sent to Client", time: "Dec 5, 2024", user: "Sarah M.", status: 2 },
    ]
  },
  {
    id: "2",
    quoteNumber: "Q-2848",
    clientName: "Michael Lee",
    destination: "Tokyo, Japan",
    value: "$4,500",
    status: "Expired",
    expiry: "5 days left",
    agentName: "John D.",
    travelDates: "Jan 10-20, 2025",
    activityTimeline: [
      { id: "a3", action: "Quote Created", time: "Dec 1, 2024", user: "John D.", status: 1 },
      { id: "a4", action: "Quote Expired", time: "Dec 6, 2024", user: "System", status: 1 },
    ]
  },
  {
    id: "3",
    quoteNumber: "Q-2849",
    clientName: "Emma Brown",
    destination: "New York, USA",
    value: "$8,750",
    status: "Draft",
    expiry: "1 week left",
    agentName: "Sarah M.",
    travelDates: "Feb 5-12, 2025",
    activityTimeline: [
      { id: "a5", action: "Quote Created", time: "Dec 10, 2024", user: "Sarah M.", status: 1 },
    ]
  },
  {
    id: "4",
    quoteNumber: "Q-2850",
    clientName: "Sarah Johnson",
    destination: "Paris, France",
    value: "$6,200",
    status: "Viewed",
    expiry: "2 days left",
    agentName: "Sarah M.",
    travelDates: "Dec 15-25, 2024",
    activityTimeline: [
      { id: "a6", action: "Quote Created", time: "Dec 5, 2024", user: "Sarah M.", status: 1 },
      { id: "a7", action: "Quote Sent to Client", time: "Dec 5, 2024", user: "Sarah M.", status: 1 },
      { id: "a8", action: "Quote Viewed by Client", time: "Dec 6, 2024", user: "Sarah Johnson", status: 2 },
    ]
  }
];
