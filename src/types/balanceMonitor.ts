export interface MonitorCondition {
  field: string;
  operator: string;
  value: number;
}

export interface MonitorData {
  condition: MonitorCondition;
  description?: string;
  balance_id: string;
  call_back_url?: string;
}

export interface MonitorDataResp extends MonitorData {
  monitor_id: string;
  created_at: Date; // ISO date string
}
