import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Doctor, Slot } from "@/types/database";

export function useDoctors() {
  return useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data as Doctor[];
    },
  });
}

export function useSlots(doctorId: string | null, date: string | null) {
  return useQuery({
    queryKey: ["slots", doctorId, date],
    queryFn: async () => {
      if (!doctorId || !date) return [];
      
      const { data, error } = await supabase
        .from("slots")
        .select("*, doctor:doctors(*)")
        .eq("doctor_id", doctorId)
        .eq("date", date)
        .eq("is_locked", false)
        .order("start_time");
      
      if (error) throw error;
      return data as Slot[];
    },
    enabled: !!doctorId && !!date,
  });
}

export function useAvailableSlots(doctorId: string | null, date: string | null) {
  return useQuery({
    queryKey: ["available-slots", doctorId, date],
    queryFn: async () => {
      if (!doctorId || !date) return [];
      
      const { data, error } = await supabase
        .from("slots")
        .select("*, doctor:doctors(*)")
        .eq("doctor_id", doctorId)
        .eq("date", date)
        .eq("is_locked", false)
        .order("start_time");
      
      if (error) throw error;
      
      // Filter slots with remaining capacity
      return (data as Slot[]).filter(
        (slot) => slot.current_bookings < slot.max_capacity
      );
    },
    enabled: !!doctorId && !!date,
  });
}
