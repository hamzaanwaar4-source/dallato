export interface Activity {
  time: string
  title: string
  location: string
  description: string
  infoBox?: string
  price: string
  color: string
}

export interface DayItem {
  day: number
  date: string
  activitiesCount: number
  hasWarning?: boolean
  activities: Activity[]
}
