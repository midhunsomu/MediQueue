export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Slot {
  id: string;
  doctor_id: string;
  date: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  current_bookings: number;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
  doctor?: Doctor;
}

export interface Booking {
  id: string;
  user_id: string;
  slot_id: string;
  doctor_id: string;
  problem_description: string;
  payment_status: "pending" | "completed" | "failed";
  booking_status: "confirmed" | "in_consultation" | "completed" | "cancelled" | "emergency";
  queue_position: number;
  is_emergency: boolean;
  payment_completed_at: string | null;
  created_at: string;
  updated_at: string;
  slot?: Slot;
  doctor?: Doctor;
  profile?: Profile;
}

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: "admin" | "user";
  created_at: string;
}
