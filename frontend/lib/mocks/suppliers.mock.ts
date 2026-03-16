import { Supplier, SupplierStats } from '../types/supplier';

export const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: '1',
    name: 'Booking.com',
    apiStatus: 'Connected',
    commission: '12%',
    agentUsage: '245 bookings',
    availability: '99.8%',
    trend: '+12%',
    trendType: 'up'
  },
  {
    id: '2',
    name: 'Airbnb',
    apiStatus: 'Connected',
    commission: '11%',
    agentUsage: '320 bookings',
    availability: '98.8%',
    trend: '+8%',
    trendType: 'up'
  },
  {
    id: '3',
    name: 'Expedia',
    apiStatus: 'Connected',
    commission: '15%',
    agentUsage: '180 bookings',
    availability: '96.8%',
    trend: '+5%',
    trendType: 'up'
  },
  {
    id: '4',
    name: 'Hotels.com',
    apiStatus: 'Error',
    commission: '12%',
    agentUsage: '150 bookings',
    availability: '97.8%',
    trend: '+3%',
    trendType: 'up'
  }
];

export const MOCK_SUPPLIER_STATS: SupplierStats = {
  mostUsed: {
    name: 'Booking.com',
    value: '245 bookings',
    subtitle: 'this month'
  },
  bestCommission: {
    name: 'Airbnb',
    value: '15%',
    subtitle: 'average commission'
  },
  fastestGrowing: {
    name: 'Airbnb',
    value: '+15%',
    subtitle: 'growth this month'
  }
};
