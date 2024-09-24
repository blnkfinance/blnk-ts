interface MonitorCondition {
  field: string;
  operator: string;
  value: number;
}

export interface MonitorData {
  monitor_id: string;
  balance_id: string;
  condition: MonitorCondition;
  description?: string;
  created_at: Date; // ISO date string
  call_back_url?: string;
}
