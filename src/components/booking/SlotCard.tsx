import { format } from "date-fns";
import { Slot } from "@/types/database";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface SlotCardProps {
  slot: Slot;
  isSelected: boolean;
  onSelect: (slot: Slot) => void;
}

export function SlotCard({ slot, isSelected, onSelect }: SlotCardProps) {
  const remainingSeats = slot.max_capacity - slot.current_bookings;
  const isFull = remainingSeats <= 0;
  const isLow = remainingSeats <= 2 && remainingSeats > 0;

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, "h:mm a");
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md",
        isSelected && "ring-2 ring-primary shadow-elevated",
        isFull && "opacity-60 cursor-not-allowed"
      )}
      onClick={() => !isFull && onSelect(slot)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
            </span>
          </div>
          <Badge
            variant={isFull ? "destructive" : isLow ? "outline" : "default"}
            className={cn(
              isLow && "border-warning text-warning",
              !isFull && !isLow && "bg-success"
            )}
          >
            {isFull ? "Full" : `${remainingSeats} left`}
          </Badge>
        </div>
        <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>
            {slot.current_bookings} / {slot.max_capacity} booked
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
