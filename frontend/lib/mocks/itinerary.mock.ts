import { DayItem } from '@/lib/types/itinerary';

export const ITINERARY_MOCK: DayItem[] = [
  { 
    day: 1, 
    date: "Dec 15, 2024", 
    activitiesCount: 5, 
    hasWarning: true,
    activities: [
      {
        time: "10:00",
        title: "Airport Arrival",
        location: "Charles de Gaulle Airport",
        description: "Arrive at CDG Airport. Private transfer to hotel included.",
        infoBox: "Driver will be waiting at arrivals with name sign",
        price: "$85",
        color: "bg-blue-500"
      },
      {
        time: "12:00",
        title: "Hotel Check-in",
        location: "Hotel Le Marais, 4th Arrondissement",
        description: "Check into your boutique hotel in the heart of Le Marais. Superior room with city view.",
        infoBox: "Early check-in confirmed. Breakfast included for both days.",
        price: "$450",
        color: "bg-purple-500"
      },
      {
        time: "2:00",
        title: "Lunch",
        location: "Café de Flore, Saint-Germain",
        description: "Traditional French bistro lunch at this iconic café.",
        price: "$60",
        color: "bg-pink-500"
      },
      {
        time: "4:00",
        title: "Seine River Cruise",
        location: "Port de la Bourdonnais",
        description: "1-hour scenic cruise along the Seine. See the Eiffel Tower, Notre-Dame, and other landmarks.",
        infoBox: "Tickets pre-booked. Board 15 minutes early.",
        price: "$35",
        color: "bg-green-500"
      },
      {
        time: "8:00",
        title: "Dinner",
        location: "Le Comptoir du Relais",
        description: "Reservation at acclaimed bistro. Try the duck confit!",
        infoBox: "Reservation under your name. Smart casual dress code.",
        price: "$95",
        color: "bg-pink-500"
      }
    ]
  },
  { 
    day: 2, 
    date: "Dec 16, 2024", 
    activitiesCount: 3, 
    hasWarning: false,
    activities: [
      {
        time: "09:00",
        title: "Private City Tour",
        location: "Paris City Center",
        description: "4-hour guided tour visiting major landmarks.",
        price: "$200",
        color: "bg-orange-500"
      },
      {
        time: "02:00",
        title: "Louvre Museum Visit",
        location: "Musée du Louvre",
        description: "Skip-the-line tickets included.",
        price: "$45",
        color: "bg-purple-500"
      },
      {
        time: "07:00",
        title: "Dinner Cruise",
        location: "Seine River",
        description: "Romantic dinner cruise with live music.",
        price: "$150",
        color: "bg-pink-500"
      }
    ]
  },
  { 
    day: 3, 
    date: "Dec 17, 2024", 
    activitiesCount: 2, 
    hasWarning: true,
    activities: [
      {
        time: "08:30",
        title: "Train to Versailles",
        location: "Gare Montparnasse",
        description: "First class tickets.",
        price: "$30",
        color: "bg-gray-500"
      },
      {
        time: "10:00",
        title: "Palace of Versailles Tour",
        location: "Château de Versailles",
        description: "Guided tour of the palace and gardens.",
        price: "$80",
        color: "bg-orange-500"
      }
    ]
  },
];
