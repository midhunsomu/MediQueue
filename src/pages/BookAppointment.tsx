import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useDoctors, useAvailableSlots } from "@/hooks/useSlots";
import { useCreateBooking } from "@/hooks/useBookings";
import { Slot } from "@/types/database";
import { Layout } from "@/components/layout/Layout";
import { SlotCard } from "@/components/booking/SlotCard";
import { PaymentModal } from "@/components/booking/PaymentModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  CalendarIcon,
  Stethoscope,
  Clock,
  FileText,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";

const problemSchema = z.object({
  description: z.string().min(10, "Please describe your symptoms in at least 10 characters").max(1000),
});

type BookingStep = "select" | "details" | "payment" | "confirmation";

export default function BookAppointment() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: doctors, isLoading: doctorsLoading } = useDoctors();
  const createBooking = useCreateBooking();

  const [step, setStep] = useState<BookingStep>("select");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [problemDescription, setProblemDescription] = useState("");
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);

  const dateString = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const { data: availableSlots, isLoading: slotsLoading } = useAvailableSlots(
    selectedDoctorId || null,
    dateString
  );

  const selectedDoctor = doctors?.find((d) => d.id === selectedDoctorId);

  const handleDoctorChange = (doctorId: string) => {
    setSelectedDoctorId(doctorId);
    setSelectedSlot(null);
  };

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot: Slot) => {
    setSelectedSlot(slot);
  };

  const handleProceedToDetails = () => {
    if (!selectedSlot) {
      toast({
        title: "Please select a time slot",
        variant: "destructive",
      });
      return;
    }
    setStep("details");
  };

  const handleProceedToPayment = async () => {
    const result = problemSchema.safeParse({ description: problemDescription });
    if (!result.success) {
      toast({
        title: "Validation Error",
        description: result.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    if (!selectedSlot || !selectedDoctorId) return;

    try {
      const booking = await createBooking.mutateAsync({
        slotId: selectedSlot.id,
        doctorId: selectedDoctorId,
        problemDescription,
      });
      setCreatedBookingId(booking.id);
      setStep("payment");
    } catch (error: unknown) {
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Could not create booking",
        variant: "destructive",
      });
    }
  };

  const handlePaymentSuccess = () => {
    navigate(`/booking/${createdBookingId}`);
  };

  const handlePaymentCancel = () => {
    // In a real app, you'd cancel the booking here
    setStep("details");
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            {[
              { key: "select", label: "Select Slot", icon: CalendarIcon },
              { key: "details", label: "Details", icon: FileText },
              { key: "payment", label: "Payment", icon: CheckCircle },
            ].map((s, i) => (
              <div key={s.key} className="flex items-center">
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                    step === s.key
                      ? "bg-primary text-primary-foreground"
                      : step === "confirmation" || 
                        (step === "payment" && i < 2) ||
                        (step === "details" && i < 1)
                      ? "bg-success/20 text-success"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <s.icon className="h-4 w-4" />
                  <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
                </div>
                {i < 2 && (
                  <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Select Slot */}
        {step === "select" && (
          <div className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  Select Doctor & Date
                </CardTitle>
                <CardDescription>
                  Choose your preferred doctor and appointment date
                </CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Doctor</Label>
                    <Select value={selectedDoctorId} onValueChange={handleDoctorChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctorsLoading ? (
                          <SelectItem value="loading" disabled>
                            Loading...
                          </SelectItem>
                        ) : doctors?.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No doctors available
                          </SelectItem>
                        ) : (
                          doctors?.map((doctor) => (
                            <SelectItem key={doctor.id} value={doctor.id}>
                              <div className="flex flex-col">
                                <span>{doctor.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {doctor.specialization}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedDoctor && (
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium">{selectedDoctor.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedDoctor.specialization}
                      </p>
                      {selectedDoctor.description && (
                        <p className="text-sm mt-2">{selectedDoctor.description}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Select Date</Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateChange}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Available Slots */}
            {selectedDoctorId && selectedDate && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Available Time Slots
                  </CardTitle>
                  <CardDescription>
                    {format(selectedDate, "EEEE, MMMM d, yyyy")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {slotsLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading available slots...
                    </div>
                  ) : availableSlots?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No available slots for this date. Please try another date.
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableSlots?.map((slot) => (
                        <SlotCard
                          key={slot.id}
                          slot={slot}
                          isSelected={selectedSlot?.id === slot.id}
                          onSelect={handleSlotSelect}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleProceedToDetails}
                disabled={!selectedSlot}
                size="lg"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === "details" && selectedSlot && (
          <div className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Appointment Details
                </CardTitle>
                <CardDescription>
                  Please describe your symptoms or reason for visit
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Appointment Summary */}
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Doctor</span>
                    <span className="font-medium">{selectedDoctor?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">
                      {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-medium">
                      {format(
                        new Date(`2000-01-01T${selectedSlot.start_time}`),
                        "h:mm a"
                      )}{" "}
                      -{" "}
                      {format(
                        new Date(`2000-01-01T${selectedSlot.end_time}`),
                        "h:mm a"
                      )}
                    </span>
                  </div>
                </div>

                {/* Problem Description */}
                <div className="space-y-2">
                  <Label htmlFor="problem">Describe Your Symptoms *</Label>
                  <Textarea
                    id="problem"
                    placeholder="Please describe your symptoms, concerns, or reason for visit in detail..."
                    value={problemDescription}
                    onChange={(e) => setProblemDescription(e.target.value)}
                    rows={5}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum 10 characters. This helps the doctor prepare for your visit.
                  </p>
                </div>

                {/* Consultation Fee */}
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Consultation Fee</span>
                    <span className="text-2xl font-bold text-primary">₹500</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("select")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleProceedToPayment}
                disabled={createBooking.isPending}
                size="lg"
              >
                {createBooking.isPending ? "Creating Booking..." : "Proceed to Payment"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === "payment" && createdBookingId && (
          <div className="animate-fade-in">
            <PaymentModal
              bookingId={createdBookingId}
              amount={500}
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          </div>
        )}
      </div>
    </Layout>
  );
}
