import { format, isAfter, isBefore, parse } from "date-fns";
import { useState } from "react";
import { Booking } from "@/types/database";
import { useQueuePosition, useCancelBooking } from "@/hooks/useBookings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Clock,
  Calendar,
  Stethoscope,
  Users,
  ChevronRight,
  XCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface BookingCardProps {
  booking: Booking;
  showCancelButton?: boolean;
}

export function BookingCard({ booking, showCancelButton = true }: BookingCardProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const cancelBooking = useCancelBooking();
  
  const { data: queueData } = useQueuePosition(
    booking.payment_status === "completed" && 
    booking.booking_status !== "completed" && 
    booking.booking_status !== "cancelled" 
      ? booking.id 
      : null
  );

  // Check if slot time has expired
  const isExpired = (() => {
    if (!booking.slot) return false;
    const now = new Date();
    const slotDate = new Date(booking.slot.date);
    const [hours, minutes] = booking.slot.end_time.split(":").map(Number);
    slotDate.setHours(hours, minutes, 0, 0);
    return isAfter(now, slotDate);
  })();

  // Determine if cancellation is allowed
  const canCancel = 
    booking.booking_status !== "completed" && 
    booking.booking_status !== "cancelled" &&
    !isExpired;

  const handleCancel = async () => {
    try {
      await cancelBooking.mutateAsync(booking.id);
      toast.success("Booking cancelled successfully");
      setCancelDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to cancel booking");
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, "h:mm a");
  };

  const getStatusBadge = () => {
    // Show expired badge if slot time has passed and booking wasn't completed
    if (isExpired && booking.booking_status !== "completed" && booking.booking_status !== "cancelled") {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Expired
      </Badge>;
    }
    
    switch (booking.booking_status) {
      case "confirmed":
        return <Badge className="bg-success">Confirmed</Badge>;
      case "in_consultation":
        return <Badge className="bg-info animate-pulse-ring">In Consultation</Badge>;
      case "completed":
        return <Badge variant="secondary">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "emergency":
        return <Badge className="bg-warning">Emergency</Badge>;
      default:
        return null;
    }
  };

  const getPaymentBadge = () => {
    switch (booking.payment_status) {
      case "completed":
        return <Badge variant="outline" className="border-success text-success">Paid</Badge>;
      case "pending":
        return <Badge variant="outline" className="border-warning text-warning">Payment Pending</Badge>;
      case "failed":
        return <Badge variant="outline" className="border-destructive text-destructive">Payment Failed</Badge>;
      default:
        return null;
    }
  };

  const isActive = 
    booking.payment_status === "completed" && 
    (booking.booking_status === "confirmed" || booking.booking_status === "in_consultation");

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      isActive && "border-primary/30 shadow-card"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-primary" />
              {booking.doctor?.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {booking.doctor?.specialization}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {getStatusBadge()}
            {getPaymentBadge()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {booking.slot && format(new Date(booking.slot.date), "MMM d, yyyy")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {booking.slot && formatTime(booking.slot.start_time)}
            </span>
          </div>
        </div>

        {isActive && queueData && (
          <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm">Queue Position</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-primary">
                #{booking.queue_position}
              </span>
              {queueData.patientsAhead > 0 && (
                <p className="text-xs text-muted-foreground">
                  {queueData.patientsAhead} ahead
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-2">
          <p className="text-xs text-muted-foreground">
            ID: {booking.id.slice(0, 8).toUpperCase()}
          </p>
          <div className="flex items-center gap-2">
            {showCancelButton && canCancel && (
              <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive/10">
                    <XCircle className="mr-1 h-4 w-4" />
                    Cancel
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Appointment?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel this appointment with {booking.doctor?.name}? 
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleCancel}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={cancelBooking.isPending}
                    >
                      {cancelBooking.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        "Yes, Cancel"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/booking/${booking.id}`}>
                View Details
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
