import { Link } from "react-router-dom";
import { format, isAfter, isBefore, startOfToday } from "date-fns";
import { useUserBookings } from "@/hooks/useBookings";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/layout/Layout";
import { BookingCard } from "@/components/booking/BookingCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  CalendarPlus,
  Loader2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  Stethoscope,
  TrendingUp,
  History,
  CalendarCheck,
  ChevronRight,
} from "lucide-react";

export default function PatientDashboard() {
  const { user, profile } = useAuth();
  const { data: bookings, isLoading } = useUserBookings();

  const today = startOfToday();

  // Categorize bookings
  const upcomingBookings = bookings?.filter((b) => {
    if (!b.slot) return false;
    const slotDate = new Date(b.slot.date);
    return (
      b.payment_status === "completed" &&
      (b.booking_status === "confirmed" || b.booking_status === "in_consultation") &&
      isAfter(slotDate, today) || format(slotDate, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")
    );
  }) || [];

  const completedBookings = bookings?.filter(
    (b) => b.booking_status === "completed"
  ) || [];

  const cancelledBookings = bookings?.filter(
    (b) => b.booking_status === "cancelled" || b.payment_status === "failed"
  ) || [];

  const totalBookings = bookings?.length || 0;

  // Get unique doctors visited
  const uniqueDoctors = new Set(
    completedBookings.map((b) => b.doctor_id)
  ).size;

  if (!user) {
    return null;
  }

  const StatCard = ({
    icon: Icon,
    label,
    value,
    trend,
    color = "primary",
  }: {
    icon: React.ElementType;
    label: string;
    value: number;
    trend?: string;
    color?: "primary" | "success" | "warning" | "destructive";
  }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold">{value}</p>
            {trend && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {trend}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-full bg-${color}/10`}>
            <Icon className={`h-6 w-6 text-${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, {profile?.name?.split(" ")[0] || "Patient"}
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's an overview of your appointments
            </p>
          </div>
          <Button asChild>
            <Link to="/book">
              <CalendarPlus className="mr-2 h-4 w-4" />
              Book Appointment
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Total Appointments</p>
                      <p className="text-3xl font-bold">{totalBookings}</p>
                    </div>
                    <div className="p-3 rounded-full bg-primary/10">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Upcoming</p>
                      <p className="text-3xl font-bold">{upcomingBookings.length}</p>
                    </div>
                    <div className="p-3 rounded-full bg-info/10">
                      <Clock className="h-6 w-6 text-info" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-3xl font-bold">{completedBookings.length}</p>
                    </div>
                    <div className="p-3 rounded-full bg-success/10">
                      <CheckCircle2 className="h-6 w-6 text-success" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Doctors Visited</p>
                      <p className="text-3xl font-bold">{uniqueDoctors}</p>
                    </div>
                    <div className="p-3 rounded-full bg-warning/10">
                      <Stethoscope className="h-6 w-6 text-warning" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Appointments */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5 text-primary" />
                    <CardTitle>Upcoming Appointments</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/bookings">
                      View All
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <CardDescription>
                  Your scheduled appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">No upcoming appointments</p>
                    <Button asChild variant="outline">
                      <Link to="/book">
                        <CalendarPlus className="mr-2 h-4 w-4" />
                        Book Now
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {upcomingBookings.slice(0, 4).map((booking) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Consultation History */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    <CardTitle>Consultation History</CardTitle>
                  </div>
                  {completedBookings.length > 5 && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/bookings">
                        View All
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
                <CardDescription>
                  Your past consultations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {completedBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No consultation history yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {completedBookings.slice(0, 5).map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-full bg-success/10">
                            <CheckCircle2 className="h-5 w-5 text-success" />
                          </div>
                          <div>
                            <p className="font-medium">{booking.doctor?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {booking.doctor?.specialization}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {booking.slot && format(new Date(booking.slot.date), "MMM d, yyyy")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {booking.slot && format(
                              new Date(`2000-01-01T${booking.slot.start_time}`),
                              "h:mm a"
                            )}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/booking/${booking.id}`}>
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <Link to="/book">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-primary/10">
                        <CalendarPlus className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Book Appointment</p>
                        <p className="text-sm text-muted-foreground">
                          Schedule a new visit
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <Link to="/bookings">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-info/10">
                        <Calendar className="h-6 w-6 text-info" />
                      </div>
                      <div>
                        <p className="font-medium">My Bookings</p>
                        <p className="text-sm text-muted-foreground">
                          View all appointments
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-success/10">
                      <Activity className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <p className="font-medium">Health Records</p>
                      <p className="text-sm text-muted-foreground">
                        Coming soon
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
