import { Link } from "react-router-dom";
import { useUserBookings } from "@/hooks/useBookings";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/layout/Layout";
import { BookingCard } from "@/components/booking/BookingCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarPlus, Loader2, Calendar } from "lucide-react";

export default function MyBookings() {
  const { user } = useAuth();
  const { data: bookings, isLoading } = useUserBookings();

  const activeBookings = bookings?.filter(
    (b) =>
      b.payment_status === "completed" &&
      (b.booking_status === "confirmed" || b.booking_status === "in_consultation")
  );

  const pastBookings = bookings?.filter(
    (b) =>
      b.booking_status === "completed" ||
      b.booking_status === "cancelled" ||
      b.payment_status === "failed"
  );

  const pendingBookings = bookings?.filter(
    (b) => b.payment_status === "pending"
  );

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Bookings</h1>
            <p className="text-muted-foreground mt-1">
              View and manage your appointments
            </p>
          </div>
          <Button asChild>
            <Link to="/book">
              <CalendarPlus className="mr-2 h-4 w-4" />
              Book New Appointment
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : bookings?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Bookings Yet</h3>
              <p className="text-muted-foreground mb-6 text-center">
                You haven't made any appointments yet. Book your first appointment now!
              </p>
              <Button asChild size="lg">
                <Link to="/book">
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Book Your First Appointment
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="active" className="space-y-6">
            <TabsList>
              <TabsTrigger value="active" className="relative">
                Active
                {activeBookings && activeBookings.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                    {activeBookings.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending
                {pendingBookings && pendingBookings.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-warning text-warning-foreground rounded-full">
                    {pendingBookings.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {activeBookings?.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12 text-muted-foreground">
                    No active bookings
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {activeBookings?.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {pendingBookings?.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12 text-muted-foreground">
                    No pending bookings
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {pendingBookings?.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {pastBookings?.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12 text-muted-foreground">
                    No past bookings
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {pastBookings?.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
}
