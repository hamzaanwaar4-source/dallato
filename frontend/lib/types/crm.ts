export interface CRMStat {
  label: string;
  value: string;
  trend?: string;
  subtext?: string;
  icon: any;
  color: string;
}

export interface CRMActivity {
  id: string;
  type: 'client_added' | 'visa_reminder' | 'preference_updated' | 'travel_notes';
  message: string;
  time: string;
  icon: any;
  iconBg: string;
  iconColor: string;
}
