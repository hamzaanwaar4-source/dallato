export interface ClientNote {
  id: string
  content: string
  date: string
  author: string
}

export interface ClientTrip {
  id: string
  destination: string
  date: string
  status: 'Upcoming' | 'Completed' | 'Cancelled'
  price: string
  image?: string
  type: 'flight' | 'cruise' | 'car'
}

export interface ClientQuote {
  id: string
  destination: string
  date: string
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Declined' | 'Sent' | 'Draft' | 'Confirmed' | 'Viewed'
  price: string
  // New fields for UI match
  quoteId: string
  version: string
  travelers: number
  validUntil: string
  duration: string
}

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  location: string
  avatar?: string
  initials: string
  color: string
  tags: string[]
  notes: string
  trips: ClientTrip[]
  quotes: ClientQuote[]
  joinedDate: string
  totalSpent: string
  status:string
  
  // New fields for UI match
  lastContact: string
  clientType: string
  isFavorite: boolean
  budgetRange: string
  travelStyle: string
  interests: string[]
  loyaltyPrograms: { name: string, number: string, type: 'airline' | 'hotel' }[]
  importantDates: { type: string, date: string }[]
  recentActivity: { action: string, date: string, status?: string, statusColor?: string }[]
  upcomingTripsCount: number
  pastTripsCount: number
  groupMembers: { name: string, relation: string, id: number, ageGroup?: string }[]
  ownerName?: string
  agency?: number
  owner?: number
  loyaltyMemberships?: any[]
  followUps?: any[]
  deals?: any[]
  destination?: string
  travelDate?: string
  commissionPercent?: string
  membership?: string
}
