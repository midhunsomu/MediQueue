import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Booking } from "@/types/database";
import { useAuth } from "./useAuth";
import { useEffect } from "react";

export function useUserBookings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["user-bookings", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          slot:slots(*),
          doctor:doctors(*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Booking[];
    },
    enabled: !!user?.id,
  });

  // Set up realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("user-bookings")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["user-bookings", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return query;
}

export function useBooking(bookingId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: async () => {
      if (!bookingId) return null;
      
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          slot:slots(*),
          doctor:doctors(*)
        `)
        .eq("id", bookingId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Booking | null;
    },
    enabled: !!bookingId,
  });

  // Set up realtime subscription for this specific booking
  useEffect(() => {
    if (!bookingId) return;

    const channel = supabase
      .channel(`booking-${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `id=eq.${bookingId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, queryClient]);

  return query;
}

interface CreateBookingParams {
  slotId: string;
  doctorId: string;
  problemDescription: string;
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ slotId, doctorId, problemDescription }: CreateBookingParams) => {
      if (!user?.id) throw new Error("User not authenticated");

      // First, check slot availability and get current queue position atomically
      const { data: slot, error: slotError } = await supabase
        .from("slots")
        .select("*")
        .eq("id", slotId)
        .single();

      if (slotError) throw slotError;
      
      if (slot.is_locked) {
        throw new Error("This slot is no longer available");
      }

      if (slot.current_bookings >= slot.max_capacity) {
        throw new Error("This slot is fully booked");
      }

      // Get current queue position for this slot
      const { data: existingBookings, error: countError } = await supabase
        .from("bookings")
        .select("id")
        .eq("slot_id", slotId)
        .eq("payment_status", "completed")
        .neq("booking_status", "cancelled");

      if (countError) throw countError;

      const queuePosition = (existingBookings?.length || 0) + 1;

      // Create the booking
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          slot_id: slotId,
          doctor_id: doctorId,
          problem_description: problemDescription,
          queue_position: queuePosition,
          payment_status: "pending",
          booking_status: "confirmed",
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      return booking as Booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      queryClient.invalidateQueries({ queryKey: ["available-slots"] });
    },
  });
}

export function useConfirmPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      // First get the booking to get slot info
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select("slot_id")
        .eq("id", bookingId)
        .single();

      if (bookingError) throw bookingError;

      // Check slot is still available
      const { data: slot, error: slotError } = await supabase
        .from("slots")
        .select("*")
        .eq("id", booking.slot_id)
        .single();

      if (slotError) throw slotError;

      if (slot.current_bookings >= slot.max_capacity) {
        // Cancel the booking and throw error
        await supabase
          .from("bookings")
          .update({ payment_status: "failed", booking_status: "cancelled" })
          .eq("id", bookingId);
        
        throw new Error("Slot became fully booked. Payment cancelled.");
      }

      // Update booking payment status
      const { data: updatedBooking, error: updateError } = await supabase
        .from("bookings")
        .update({
          payment_status: "completed",
          payment_completed_at: new Date().toISOString(),
        })
        .eq("id", bookingId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Increment slot current_bookings
      const { error: slotUpdateError } = await supabase
        .from("slots")
        .update({ current_bookings: slot.current_bookings + 1 })
        .eq("id", booking.slot_id);

      if (slotUpdateError) throw slotUpdateError;

      // Lock slot if full
      if (slot.current_bookings + 1 >= slot.max_capacity) {
        await supabase
          .from("slots")
          .update({ is_locked: true })
          .eq("id", booking.slot_id);
      }

      return updatedBooking as Booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking"] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      queryClient.invalidateQueries({ queryKey: ["available-slots"] });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      // Get the booking first
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select("*, slot:slots(*)")
        .eq("id", bookingId)
        .single();

      if (bookingError) throw bookingError;

      // Only allow cancellation for pending or confirmed bookings
      if (booking.booking_status === "completed" || booking.booking_status === "cancelled") {
        throw new Error("Cannot cancel a completed or already cancelled booking");
      }

      // Update booking status to cancelled
      const { error: updateError } = await supabase
        .from("bookings")
        .update({ 
          booking_status: "cancelled",
          updated_at: new Date().toISOString()
        })
        .eq("id", bookingId);

      if (updateError) throw updateError;

      // If payment was completed, decrement slot bookings
      if (booking.payment_status === "completed" && booking.slot) {
        const newCount = Math.max(0, booking.slot.current_bookings - 1);
        await supabase
          .from("slots")
          .update({ 
            current_bookings: newCount,
            is_locked: false // Unlock slot since there's now space
          })
          .eq("id", booking.slot_id);
      }

      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking"] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      queryClient.invalidateQueries({ queryKey: ["available-slots"] });
    },
  });
}

export function useQueuePosition(bookingId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["queue-position", bookingId],
    queryFn: async () => {
      if (!bookingId) return null;

      // Get the booking
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select("*, slot:slots(*)")
        .eq("id", bookingId)
        .single();

      if (bookingError) throw bookingError;

      // Count patients ahead (completed bookings with earlier queue position)
      const { data: aheadBookings, error: countError } = await supabase
        .from("bookings")
        .select("id, booking_status")
        .eq("slot_id", booking.slot_id)
        .eq("payment_status", "completed")
        .lt("queue_position", booking.queue_position)
        .neq("booking_status", "completed")
        .neq("booking_status", "cancelled");

      if (countError) throw countError;

      return {
        queuePosition: booking.queue_position,
        patientsAhead: aheadBookings?.length || 0,
        bookingStatus: booking.booking_status,
        slot: booking.slot,
      };
    },
    enabled: !!bookingId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Set up realtime subscription
  useEffect(() => {
    if (!bookingId) return;

    const channel = supabase
      .channel(`queue-${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["queue-position", bookingId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, queryClient]);

  return query;
}
