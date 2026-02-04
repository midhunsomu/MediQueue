import { useState } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  useAllDoctors,
  useCreateDoctor,
  useAllSlots,
  useCreateSlot,
  useAllBookings,
  useUpdateBookingStatus,
  useInsertEmergency,
} from "@/hooks/useAdmin";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import {
  Users,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Stethoscope,
  AlertTriangle,
  Play,
  CheckCircle,
  Loader2,
} from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading } = useAuth();

  // State
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");

  // Doctor form
  const [newDoctorName, setNewDoctorName] = useState("");
  const [newDoctorSpec, setNewDoctorSpec] = useState("");
  const [newDoctorDesc, setNewDoctorDesc] = useState("");
  const [doctorDialogOpen, setDoctorDialogOpen] = useState(false);

  // Slot form
  const [newSlotStartTime, setNewSlotStartTime] = useState("09:00");
  const [newSlotEndTime, setNewSlotEndTime] = useState("09:30");
  const [newSlotCapacity, setNewSlotCapacity] = useState("10");
  const [slotDialogOpen, setSlotDialogOpen] = useState(false);

  // Emergency form
  const [emergencyPatientName, setEmergencyPatientName] = useState("");
  const [emergencyProblem, setEmergencyProblem] = useState("");
  const [emergencyDialogOpen, setEmergencyDialogOpen] = useState(false);

  // Queries
  const { data: doctors, isLoading: doctorsLoading } = useAllDoctors();
  const dateString = selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined;
  const { data: slots, isLoading: slotsLoading } = useAllSlots(selectedDoctorId || undefined, dateString);
  const { data: bookings, isLoading: bookingsLoading } = useAllBookings(selectedSlotId || undefined);

  // Mutations
  const createDoctor = useCreateDoctor();
  const createSlot = useCreateSlot();
  const updateBookingStatus = useUpdateBookingStatus();
  const insertEmergency = useInsertEmergency();

  // Redirect if not admin
  if (!authLoading && (!user || !isAdmin)) {
    navigate("/");
    return null;
  }

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const handleCreateDoctor = async () => {
    if (!newDoctorName || !newDoctorSpec) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    try {
      await createDoctor.mutateAsync({
        name: newDoctorName,
        specialization: newDoctorSpec,
        description: newDoctorDesc || null,
        is_active: true,
      });
      toast({ title: "Doctor created successfully" });
      setDoctorDialogOpen(false);
      setNewDoctorName("");
      setNewDoctorSpec("");
      setNewDoctorDesc("");
    } catch (error: unknown) {
      toast({
        title: "Failed to create doctor",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleCreateSlot = async () => {
    if (!selectedDoctorId || !selectedDate) {
      toast({ title: "Please select a doctor and date", variant: "destructive" });
      return;
    }

    try {
      await createSlot.mutateAsync({
        doctor_id: selectedDoctorId,
        date: format(selectedDate, "yyyy-MM-dd"),
        start_time: newSlotStartTime,
        end_time: newSlotEndTime,
        max_capacity: parseInt(newSlotCapacity),
        current_bookings: 0,
        is_locked: false,
      });
      toast({ title: "Slot created successfully" });
      setSlotDialogOpen(false);
    } catch (error: unknown) {
      toast({
        title: "Failed to create slot",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (bookingId: string, status: "in_consultation" | "completed") => {
    try {
      await updateBookingStatus.mutateAsync({ bookingId, status });
      toast({ title: `Booking marked as ${status}` });
    } catch (error: unknown) {
      toast({
        title: "Failed to update status",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleInsertEmergency = async () => {
    if (!selectedSlotId || !emergencyPatientName || !emergencyProblem) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    const slot = slots?.find((s) => s.id === selectedSlotId);
    if (!slot) return;

    try {
      await insertEmergency.mutateAsync({
        slotId: selectedSlotId,
        doctorId: slot.doctor_id,
        patientName: emergencyPatientName,
        problemDescription: emergencyProblem,
      });
      toast({
        title: "Emergency case inserted",
        description: "All other patients have been notified of queue change",
      });
      setEmergencyDialogOpen(false);
      setEmergencyPatientName("");
      setEmergencyProblem("");
    } catch (error: unknown) {
      toast({
        title: "Failed to insert emergency",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, "h:mm a");
  };

  const slotBookings = bookings?.filter((b) => b.slot_id === selectedSlotId && b.payment_status === "completed");

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage doctors, slots, and appointments
          </p>
        </div>

        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList>
            <TabsTrigger value="schedule">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Schedule Management
            </TabsTrigger>
            <TabsTrigger value="doctors">
              <Stethoscope className="h-4 w-4 mr-2" />
              Doctors
            </TabsTrigger>
            <TabsTrigger value="bookings">
              <Users className="h-4 w-4 mr-2" />
              Bookings
            </TabsTrigger>
          </TabsList>

          {/* Schedule Management Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Doctor & Date Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select Doctor & Date</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Doctor</Label>
                    <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors?.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            {doctor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Slots List */}
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Time Slots</CardTitle>
                    <CardDescription>
                      {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
                    </CardDescription>
                  </div>
                  <Dialog open={slotDialogOpen} onOpenChange={setSlotDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" disabled={!selectedDoctorId || !selectedDate}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Slot
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Slot</DialogTitle>
                        <DialogDescription>
                          Add a new time slot for {doctors?.find((d) => d.id === selectedDoctorId)?.name}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Start Time</Label>
                            <Input
                              type="time"
                              value={newSlotStartTime}
                              onChange={(e) => setNewSlotStartTime(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>End Time</Label>
                            <Input
                              type="time"
                              value={newSlotEndTime}
                              onChange={(e) => setNewSlotEndTime(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Max Capacity</Label>
                          <Input
                            type="number"
                            min="1"
                            value={newSlotCapacity}
                            onChange={(e) => setNewSlotCapacity(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setSlotDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateSlot} disabled={createSlot.isPending}>
                          {createSlot.isPending ? "Creating..." : "Create Slot"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {slotsLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                  ) : !selectedDoctorId ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Select a doctor to view slots
                    </div>
                  ) : slots?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No slots for this date
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {slots?.map((slot) => (
                        <div
                          key={slot.id}
                          className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                            selectedSlotId === slot.id
                              ? "border-primary bg-primary/5"
                              : "hover:bg-muted"
                          }`}
                          onClick={() => setSelectedSlotId(slot.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={slot.is_locked ? "destructive" : "outline"}
                              >
                                {slot.current_bookings}/{slot.max_capacity}
                              </Badge>
                              {slot.is_locked && (
                                <Badge variant="destructive">Locked</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Slot Bookings */}
            {selectedSlotId && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Bookings for Selected Slot</CardTitle>
                    <CardDescription>
                      {slotBookings?.length || 0} confirmed bookings
                    </CardDescription>
                  </div>
                  <Dialog open={emergencyDialogOpen} onOpenChange={setEmergencyDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Insert Emergency
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                          <AlertTriangle className="h-5 w-5" />
                          Insert Emergency Case
                        </DialogTitle>
                        <DialogDescription>
                          This will move all existing patients back in the queue.
                          The emergency will be placed at position #1.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Patient Name</Label>
                          <Input
                            value={emergencyPatientName}
                            onChange={(e) => setEmergencyPatientName(e.target.value)}
                            placeholder="Enter patient name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Emergency Description</Label>
                          <Textarea
                            value={emergencyProblem}
                            onChange={(e) => setEmergencyProblem(e.target.value)}
                            placeholder="Describe the emergency..."
                            rows={3}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setEmergencyDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleInsertEmergency}
                          disabled={insertEmergency.isPending}
                        >
                          {insertEmergency.isPending ? "Inserting..." : "Insert Emergency"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {bookingsLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                  ) : slotBookings?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No bookings for this slot
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Queue</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Problem</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {slotBookings?.sort((a, b) => a.queue_position - b.queue_position).map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell>
                              <span className="font-bold text-lg">#{booking.queue_position}</span>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{booking.profile?.name || "Unknown"}</p>
                                <p className="text-xs text-muted-foreground">
                                  ID: {booking.id.slice(0, 8).toUpperCase()}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {booking.problem_description}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  booking.booking_status === "in_consultation"
                                    ? "default"
                                    : booking.booking_status === "completed"
                                    ? "secondary"
                                    : booking.is_emergency
                                    ? "destructive"
                                    : "outline"
                                }
                                className={
                                  booking.booking_status === "in_consultation"
                                    ? "bg-info"
                                    : booking.booking_status === "confirmed"
                                    ? "bg-success text-success-foreground"
                                    : ""
                                }
                              >
                                {booking.is_emergency && "🚨 "}
                                {booking.booking_status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {booking.booking_status === "confirmed" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateStatus(booking.id, "in_consultation")}
                                  >
                                    <Play className="h-3 w-3 mr-1" />
                                    Start
                                  </Button>
                                )}
                                {booking.booking_status === "in_consultation" && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateStatus(booking.id, "completed")}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Complete
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Doctors Tab */}
          <TabsContent value="doctors" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Manage Doctors</CardTitle>
                  <CardDescription>Add and manage doctor profiles</CardDescription>
                </div>
                <Dialog open={doctorDialogOpen} onOpenChange={setDoctorDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Doctor
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Doctor</DialogTitle>
                      <DialogDescription>
                        Create a new doctor profile
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input
                          value={newDoctorName}
                          onChange={(e) => setNewDoctorName(e.target.value)}
                          placeholder="Dr. John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Specialization *</Label>
                        <Input
                          value={newDoctorSpec}
                          onChange={(e) => setNewDoctorSpec(e.target.value)}
                          placeholder="General Medicine"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={newDoctorDesc}
                          onChange={(e) => setNewDoctorDesc(e.target.value)}
                          placeholder="Brief description..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDoctorDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateDoctor} disabled={createDoctor.isPending}>
                        {createDoctor.isPending ? "Creating..." : "Add Doctor"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {doctorsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : doctors?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No doctors added yet
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {doctors?.map((doctor) => (
                      <Card key={doctor.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{doctor.name}</CardTitle>
                              <CardDescription>{doctor.specialization}</CardDescription>
                            </div>
                            <Badge variant={doctor.is_active ? "default" : "secondary"}>
                              {doctor.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </CardHeader>
                        {doctor.description && (
                          <CardContent>
                            <p className="text-sm text-muted-foreground">{doctor.description}</p>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Bookings</CardTitle>
                <CardDescription>View all appointment bookings</CardDescription>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : bookings?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No bookings yet
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Booking ID</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings?.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-mono text-sm">
                            {booking.id.slice(0, 8).toUpperCase()}
                          </TableCell>
                          <TableCell>{booking.profile?.name || "Unknown"}</TableCell>
                          <TableCell>{booking.doctor?.name}</TableCell>
                          <TableCell>
                            {booking.slot && (
                              <>
                                {format(new Date(booking.slot.date), "MMM d, yyyy")}
                                <br />
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(booking.slot.start_time)}
                                </span>
                              </>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                booking.payment_status === "completed"
                                  ? "default"
                                  : booking.payment_status === "failed"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className={
                                booking.payment_status === "completed" ? "bg-success" : ""
                              }
                            >
                              {booking.payment_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                booking.booking_status === "completed"
                                  ? "secondary"
                                  : booking.booking_status === "cancelled"
                                  ? "destructive"
                                  : "outline"
                              }
                            >
                              {booking.booking_status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
