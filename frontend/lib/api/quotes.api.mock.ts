import { simulateApiCall } from './apiInterceptor';
import { QuotesData, Supplier, Recommendation } from '@/lib/types/quotes';
// import { QUOTES_STATS_MOCK, SUPPLIERS_MOCK, RECOMMENDATIONS_MOCK } from '@/lib/mocks/quotes.mock';

export const getQuotesData = () => simulateApiCall<QuotesData>({ stats: [] });
export const getSuppliers = () => simulateApiCall<Supplier[]>([]);
export const getRecommendations = () => simulateApiCall<Recommendation[]>([]);

export const APPROVED_QUOTES_MOCK: any[] = [
  {
    id: "1",
    quoteId: "Q-2847",
    clientName: "Sarah Johnson",
    destination: "Paris, France",
    price: "$6,200",
    status: "Approved",
    date: "Dec 15, 2024",
    version: "v2"
  },
  {
    id: "2",
    quoteId: "Q-2848",
    clientName: "Michael Lee",
    destination: "Tokyo, Japan",
    price: "$4,500",
    status: "Pending Approval",
    date: "Jan 10, 2025",
    version: "v1"
  },
  {
    id: "3",
    quoteId: "Q-2849",
    clientName: "Emma Brown",
    destination: "New York, USA",
    price: "$8,750",
    status: "Booked",
    date: "Feb 5, 2025",
    version: "v3"
  }
];
