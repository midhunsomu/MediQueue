import { format } from "date-fns";
import { Booking } from "@/types/database";
import { useQueuePosition } from "@/hooks/useBookings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  Clock,
  Users,
  AlertTriangle,
  Stethoscope,
  Calendar,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingConfirmationProps {
  booking: Booking;
}

export function BookingConfirmation({ booking }: BookingConfirmationProps) {
  const { data: queueData, isLoading } = useQueuePosition(booking.id);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, "h:mm a");
  };

  const getStatusBadge = () => {
    switch (booking.booking_status) {
      case "confirmed":
        return <Badge className="bg-success">Confirmed</Badge>;
      case "in_consultation":
        return <Badge className="bg-info">In Consultation</Badge>;
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

  const estimatedWaitTime = queueData?.patientsAhead 
    ? `${queueData.patientsAhead * 15} - ${queueData.patientsAhead * 20} minutes`
    : "Very soon";

  return (
    <Card className="shadow-elevated animate-slide-up">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 p-3 bg-success/10 rounded-full w-fit">
          <CheckCircle className="h-10 w-10 text-success" />
        </div>
        <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
        <p className="text-muted-foreground">
          Your appointment has been successfully booked
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Booking ID */}
        <div className="bg-muted p-4 rounded-lg text-center">
          <p className="text-sm text-muted-foreground mb-1">Booking ID</p>
          <p className="font-mono text-lg font-bold text-primary">
            {booking.id.slice(0, 8).toUpperCase()}
          </p>
        </div>

        {/* Queue Position Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Hash className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Queue Position</p>
                  <p className="text-2xl font-bold text-primary">
                    {isLoading ? "..." : booking.queue_position}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Patients Ahead</p>
                <p className="text-xl font-semibold">
                  {isLoading ? "..." : queueData?.patientsAhead || 0}
                </p>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Estimated wait:</span>
              <span className="font-medium">{estimatedWaitTime}</span>
            </div>
          </CardContent>
        </Card>

        {/* Appointment Details */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Appointment Details
          </h3>
          
          <div className="grid gap-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status</span>
              {getStatusBadge()}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium">
                {booking.slot && format(new Date(booking.slot.date), "EEEE, MMM d, yyyy")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time</span>
              <span className="font-medium">
                {booking.slot && 
                  `${formatTime(booking.slot.start_time)} - ${formatTime(booking.slot.end_time)}`
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Doctor</span>
              <span className="font-medium">{booking.doctor?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Specialization</span>
              <span className="font-medium">{booking.doctor?.specialization}</span>
            </div>
          </div>
        </div>

        {/* Problem Description */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Reason for Visit
          </h3>
          <p className="text-muted-foreground bg-muted p-3 rounded-lg">
            {booking.problem_description}
          </p>
        </div>

        {/* Notice */}
        <div className="flex items-start gap-3 p-4 bg-warning/10 rounded-lg border border-warning/20">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-warning">Important Notice</p>
            <p className="text-muted-foreground mt-1">
              Queue positions may change due to emergency cases. 
              Please arrive 10 minutes before your estimated time.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
