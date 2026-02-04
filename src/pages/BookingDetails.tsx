import { useParams, Link } from "react-router-dom";
import { useBooking } from "@/hooks/useBookings";
import { Layout } from "@/components/layout/Layout";
import { BookingConfirmation } from "@/components/booking/BookingConfirmation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function BookingDetails() {
  const { id } = useParams<{ id: string }>();
  const { data: booking, isLoading, error } = useBooking(id || null);

  return (
    <Layout>
      <div className="container py-8 max-w-2xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/bookings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Bookings
          </Link>
        </Button>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <p className="text-destructive">Error loading booking details</p>
          </div>
        )}

        {booking && <BookingConfirmation booking={booking} />}

        {!isLoading && !booking && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Booking not found</p>
            <Button asChild className="mt-4">
              <Link to="/bookings">View All Bookings</Link>
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
