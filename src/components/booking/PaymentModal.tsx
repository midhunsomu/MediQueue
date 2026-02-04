import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useConfirmPayment } from "@/hooks/useBookings";
import { toast } from "@/hooks/use-toast";

interface PaymentModalProps {
  bookingId: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PaymentModal({ bookingId, amount, onSuccess, onCancel }: PaymentModalProps) {
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "failed">("idle");
  const confirmPayment = useConfirmPayment();

  const handlePayment = async (simulate: "success" | "failure") => {
    setStatus("processing");
    
    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (simulate === "failure") {
      setStatus("failed");
      toast({
        title: "Payment Failed",
        description: "Your payment could not be processed. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      await confirmPayment.mutateAsync(bookingId);
      setStatus("success");
      toast({
        title: "Payment Successful!",
        description: "Your booking has been confirmed.",
      });
      
      // Wait a moment before transitioning
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error: unknown) {
      setStatus("failed");
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-elevated">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
          <CreditCard className="h-8 w-8 text-primary" />
        </div>
        <CardTitle>Mock Payment Gateway</CardTitle>
        <CardDescription>
          This is a simulated payment for demonstration purposes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">Amount Due</p>
          <p className="text-3xl font-bold text-foreground">₹{amount}</p>
        </div>

        {status === "idle" && (
          <div className="space-y-3">
            <Button
              onClick={() => handlePayment("success")}
              className="w-full gradient-primary"
              size="lg"
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              Simulate Successful Payment
            </Button>
            <Button
              onClick={() => handlePayment("failure")}
              variant="outline"
              className="w-full border-destructive text-destructive hover:bg-destructive/10"
              size="lg"
            >
              <XCircle className="mr-2 h-5 w-5" />
              Simulate Failed Payment
            </Button>
            <Button
              onClick={onCancel}
              variant="ghost"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        )}

        {status === "processing" && (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Processing payment...</p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center py-8">
            <div className="mx-auto mb-4 p-3 bg-success/10 rounded-full w-fit">
              <CheckCircle className="h-12 w-12 text-success" />
            </div>
            <p className="text-lg font-medium text-success">Payment Successful!</p>
            <p className="text-muted-foreground">Your booking is confirmed.</p>
          </div>
        )}

        {status === "failed" && (
          <div className="text-center space-y-4">
            <div className="mx-auto mb-4 p-3 bg-destructive/10 rounded-full w-fit">
              <XCircle className="h-12 w-12 text-destructive" />
            </div>
            <p className="text-lg font-medium text-destructive">Payment Failed</p>
            <Button onClick={() => setStatus("idle")} variant="outline">
              Try Again
            </Button>
            <Button onClick={onCancel} variant="ghost" className="w-full">
              Cancel Booking
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
