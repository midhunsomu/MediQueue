import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Hospital,
  CalendarPlus,
  Clock,
  Users,
  Shield,
  CheckCircle,
  ArrowRight,
  Stethoscope,
  Heart,
  Activity,
} from "lucide-react";

export default function Index() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const features = [
    {
      icon: CalendarPlus,
      title: "Easy Booking",
      description: "Select your preferred doctor, date, and time slot with just a few clicks.",
    },
    {
      icon: Clock,
      title: "Real-time Queue",
      description: "Know exactly where you stand in the queue and estimated wait time.",
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Safe and secure payment processing for your consultation fees.",
    },
    {
      icon: Users,
      title: "Transparent System",
      description: "No hidden overbooking. What you see is what you get.",
    },
  ];

  const steps = [
    {
      number: "1",
      title: "Choose Doctor & Date",
      description: "Select from our panel of experienced doctors",
    },
    {
      number: "2",
      title: "Pick Time Slot",
      description: "See available slots with remaining capacity",
    },
    {
      number: "3",
      title: "Describe Symptoms",
      description: "Help the doctor prepare for your visit",
    },
    {
      number: "4",
      title: "Complete Payment",
      description: "Secure your spot with instant confirmation",
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-95" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        
        <div className="container relative py-20 lg:py-32">
          <div className="max-w-3xl mx-auto text-center text-primary-foreground">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-foreground/10 rounded-full mb-6">
              <Hospital className="h-4 w-4" />
              <span className="text-sm font-medium">MediQueue Hospital OPD System</span>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Your Health Journey,{" "}
              <span className="text-primary-foreground/90">Simplified</span>
            </h1>
            
            <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Book appointments with ease, track your queue position in real-time, 
              and never wait in uncertainty again. Transparent, efficient, and patient-first.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <>
                  <Button
                    size="lg"
                    variant="secondary"
                    className="text-lg px-8"
                    onClick={() => navigate("/book")}
                  >
                    Book Appointment
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="secondary"
                    className="text-lg px-8"
                    onClick={() => navigate("/bookings")}
                  >
                    View My Bookings
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="lg"
                    variant="secondary"
                    className="text-lg px-8"
                    onClick={() => navigate("/auth")}
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                    onClick={() => navigate("/auth")}
                  >
                    Sign In
                  </Button>
                </>
              )}
            </div>

            {isAdmin && (
              <div className="mt-6">
                <Button
                  variant="link"
                  className="text-primary-foreground/80"
                  onClick={() => navigate("/admin")}
                >
                  Go to Admin Dashboard →
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
          >
            <path
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              className="fill-background"
            />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose MediQueue?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We've reimagined the hospital OPD experience to put patients first
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="border-0 shadow-card hover:shadow-elevated transition-shadow">
                <CardHeader>
                  <div className="p-3 bg-primary/10 rounded-lg w-fit mb-2">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-muted/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Book your appointment in 4 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full gradient-primary text-primary-foreground font-bold text-xl flex items-center justify-center mx-auto mb-4">
                    {step.number}
                  </div>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-[60%] w-[80%] h-0.5 bg-border" />
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button size="lg" onClick={() => navigate(user ? "/book" : "/auth")}>
              {user ? "Book Now" : "Get Started"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Stethoscope, value: "50+", label: "Expert Doctors" },
              { icon: Users, value: "10K+", label: "Happy Patients" },
              { icon: Heart, value: "99%", label: "Satisfaction Rate" },
              { icon: Activity, value: "24/7", label: "Support Available" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-primary">
        <div className="container text-center text-primary-foreground">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Experience Better Healthcare?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join thousands of patients who have simplified their hospital visits with MediQueue.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="text-lg px-8"
            onClick={() => navigate(user ? "/book" : "/auth")}
          >
            {user ? "Book Your Appointment" : "Create Free Account"}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </Layout>
  );
}
