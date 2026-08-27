export type TokenStatus = 
  | 'Registered'
  | 'In Queue'
  | 'Quality Check'
  | 'Procured'
  | 'Payment Sent'
  | 'Rejected'
  | 'Cancelled';

export type CropType = 
  | 'Wheat (गेहूं)'
  | 'Paddy (धान / चावल)'
  | 'Soybean (सोयाबीन)'
  | 'Mustard (सरसों)'
  | 'Gram (चना)'
  | 'Maize (मक्का)'
  | 'Cotton (कपास)';

export interface QualityCheckResult {
  grade: 'Grade A (FAQ)' | 'Grade B' | 'Grade C' | 'Rejected';
  moisture: number; // percentage e.g. 11.5%
  impurities: number; // percentage e.g. 1.2%
  offered_rate?: number; // offered price per quintal in INR based on quality
  notes?: string;
  inspector_name: string;
  inspected_at: string;
}

export interface StatusHistoryItem {
  status: TokenStatus;
  timestamp: string;
  note?: string;
}

export interface Token {
  token_id: string;
  farmer_id: string;
  farmer_name: string;
  farmer_phone: string;
  farmer_village: string;
  center_id: string;
  center_name: string;
  crop: string;
  quantity: number; // in Quintals (1 Quintal = 100 kg)
  msp_rate: number; // in INR per Quintal
  preferred_slot: string;
  token_number: string; // e.g. "A-104"
  queue_position: number; // 1-based, 0 if completed
  estimated_time: string; // e.g. "~35 mins" or "10:15 AM"
  estimated_minutes: number;
  status: TokenStatus;
  quality_check_result?: QualityCheckResult;
  payment_amount: number;
  payment_method?: string;
  payment_reference?: string;
  payment_confirmed_at?: string | null;
  status_history: StatusHistoryItem[];
  created_at: string;
  updated_at: string;
}

export interface Farmer {
  farmer_id: string;
  name: string;
  phone: string;
  village: string;
  district?: string;
  aadhaar_last4?: string;
  bank_account_last4?: string;
  is_aadhaar_verified?: boolean;
  created_at: string;
}

export interface Center {
  center_id: string;
  name: string;
  location: string;
  district: string;
  state: string;
  slots: string[];
  daily_capacity: number; // in Quintals
  current_load_quintals: number;
  active_tokens_count: number;
  avg_service_time_min: number;
  operational_status: 'Active' | 'High Traffic' | 'Full';
}

export interface SMSLog {
  id: string;
  token_id: string;
  phone: string;
  farmer_name: string;
  message: string;
  message_hi?: string;
  trigger_event: 'TOKEN_CONFIRMED' | 'QUEUE_ADVANCED' | 'TURN_APPROACHING' | 'QUALITY_CHECK_DONE' | 'PROCURED' | 'PAYMENT_SENT';
  sent_at: string;
  status: 'Delivered' | 'Sent';
}

export interface CenterAnalytics {
  center_id: string;
  center_name: string;
  total_tokens_today: number;
  procured_tokens_today: number;
  total_quantity_procured: number; // quintals
  total_payout_inr: number;
  avg_wait_time_minutes: number;
  no_show_rate: number; // percentage e.g. 4.2%
  capacity_utilization: number; // percentage e.g. 78%
  crop_breakdown: { crop: string; quantity: number; amount: number }[];
  hourly_arrivals: { hour: string; count: number }[];
}

export interface MinistryOverview {
  total_centers: number;
  active_centers: number;
  total_farmers_served_today: number;
  total_procurement_quintals: number;
  total_disbursed_inr: number;
  overall_avg_wait_time_min: number;
  system_efficiency_score: number;
  center_performance: CenterAnalytics[];
}

export type AppRole = 'farmer' | 'staff' | 'sms' | 'admin';
export type AppLanguage = 'en' | 'hi';
