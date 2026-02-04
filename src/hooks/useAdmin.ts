import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Doctor, Slot, Booking } from "@/types/database";

// Doctors management
export function useAllDoctors() {
  return useQuery({
    queryKey: ["admin-doctors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as Doctor[];
    },
  });
}

export function useCreateDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (doctor: Omit<Doctor, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("doctors")
        .insert(doctor)
        .select()
        .single();
      
      if (error) throw error;
      return data as Doctor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-doctors"] });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
  });
}

export function useUpdateDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Doctor> & { id: string }) => {
      const { data, error } = await supabase
        .from("doctors")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Doctor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-doctors"] });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
  });
}

// Slots management
export function useAllSlots(doctorId?: string, date?: string) {
  return useQuery({
    queryKey: ["admin-slots", doctorId, date],
    queryFn: async () => {
      let query = supabase
        .from("slots")
        .select("*, doctor:doctors(*)")
        .order("date")
        .order("start_time");
      
      if (doctorId) {
        query = query.eq("doctor_id", doctorId);
      }
      if (date) {
        query = query.eq("date", date);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Slot[];
    },
  });
}

export function useCreateSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slot: Omit<Slot, "id" | "created_at" | "updated_at" | "doctor">) => {
      const { data, error } = await supabase
        .from("slots")
        .insert(slot)
        .select()
        .single();
      
      if (error) throw error;
      return data as Slot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-slots"] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      queryClient.invalidateQueries({ queryKey: ["available-slots"] });
    },
  });
}

export function useUpdateSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Slot> & { id: string }) => {
      const { data, error } = await supabase
        .from("slots")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Slot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-slots"] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      queryClient.invalidateQueries({ queryKey: ["available-slots"] });
    },
  });
}

// Bookings management
export function useAllBookings(slotId?: string, date?: string) {
  return useQuery({
    queryKey: ["admin-bookings", slotId, date],
    queryFn: async () => {
      // First get bookings
      let query = supabase
        .from("bookings")
        .select(`
          *,
          slot:slots(*),
          doctor:doctors(*)
        `)
        .order("queue_position");
      
      if (slotId) {
        query = query.eq("slot_id", slotId);
      }
      
      const { data: bookingsData, error } = await query;
      if (error) throw error;
      
      // Then get profiles for all user_ids
      const userIds = [...new Set((bookingsData || []).map(b => b.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", userIds);
      
      // Map profiles to bookings
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      
      return (bookingsData || []).map(booking => ({
        ...booking,
        profile: profileMap.get(booking.user_id) || null,
      })) as Booking[];
    },
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      status,
    }: {
      bookingId: string;
      status: Booking["booking_status"];
    }) => {
      const { data, error } = await supabase
        .from("bookings")
        .update({ booking_status: status })
        .eq("id", bookingId)
        .select()
        .single();
      
      if (error) throw error;
      return data as Booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["user-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking"] });
      queryClient.invalidateQueries({ queryKey: ["queue-position"] });
    },
  });
}

export function useInsertEmergency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slotId,
      doctorId,
      patientName,
      problemDescription,
    }: {
      slotId: string;
      doctorId: string;
      patientName: string;
      problemDescription: string;
    }) => {
      // Get current slot info
      const { data: slot, error: slotError } = await supabase
        .from("slots")
        .select("*")
        .eq("id", slotId)
        .single();

      if (slotError) throw slotError;

      // Get all current bookings for this slot and shift them
      const { data: existingBookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .eq("slot_id", slotId)
        .eq("payment_status", "completed")
        .neq("booking_status", "completed")
        .neq("booking_status", "cancelled")
        .order("queue_position");

      if (bookingsError) throw bookingsError;

      // Shift all queue positions by 1
      for (const booking of existingBookings || []) {
        await supabase
          .from("bookings")
          .update({ queue_position: booking.queue_position + 1 })
          .eq("id", booking.id);
      }

      // Create emergency booking at position 1
      // Note: For emergency, we're creating a booking without a real user
      // In a real system, you'd have admin create patient on the fly
      const { data: emergencyBooking, error: emergencyError } = await supabase
        .from("bookings")
        .insert({
          user_id: (await supabase.auth.getUser()).data.user!.id, // Admin's ID as placeholder
          slot_id: slotId,
          doctor_id: doctorId,
          problem_description: `EMERGENCY: ${patientName} - ${problemDescription}`,
          payment_status: "completed",
          booking_status: "emergency",
          queue_position: 1,
          is_emergency: true,
          payment_completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (emergencyError) throw emergencyError;

      // Update slot current_bookings
      await supabase
        .from("slots")
        .update({ current_bookings: slot.current_bookings + 1 })
        .eq("id", slotId);

      return emergencyBooking as Booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-slots"] });
      queryClient.invalidateQueries({ queryKey: ["user-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["queue-position"] });
    },
  });
}
