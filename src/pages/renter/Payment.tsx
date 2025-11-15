import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CreditCard, Calendar, Clock, Bike } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { loadStripe } from "@stripe/stripe-js";
import { differenceInDays, differenceInHours, format } from "date-fns";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "./checkout";

const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
let stripePromise = loadStripe(stripeKey);

const Payment = () => {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [stripePaymentIntent, setStripePaymentIntent] = useState<any>(null);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [isBookingLoading, setIsBookingLoading] = useState(false);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!bookingId) {
        return;
      }

      try {
        setIsBookingLoading(true);
        const bookingDetails = await getBookingDetails(bookingId);
        createPaymentIntent(bookingDetails.id);
        setBookingDetails(bookingDetails);
      } catch (error: any) {
        console.error("Failed to load booking details:", error);
        toast({
          title: "Unable to load booking",
          description:
            error?.response?.data?.message ??
            "Please try again or contact support.",
          variant: "destructive",
        });
      } finally {
        setIsBookingLoading(false);
      }
    };
    fetchBookingDetails();
  }, [bookingId, toast]);

  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvv: "",
  });

  const getBookingDetails = async (bookingId: string) => {
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data.data;
  }
  
  const createPaymentIntent = async (bookingId: string) => {
    const response = await api.post(`/payments/create-payment-intent`, { bookingId });

    setStripePaymentIntent(response.data.data);
  }
  

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    let formattedValue = value;
    
    if (name === "cardNumber") {
      formattedValue = value.replace(/\s/g, "").replace(/(\d{4})/g, "$1 ").trim();
      if (formattedValue.length > 19) return;
    }
    
    if (name === "expiry") {
      formattedValue = value.replace(/\D/g, "");
      if (formattedValue.length >= 2) {
        formattedValue = formattedValue.slice(0, 2) + "/" + formattedValue.slice(2, 4);
      }
      if (formattedValue.length > 5) return;
    }
    
    if (name === "cvv") {
      formattedValue = value.replace(/\D/g, "");
      if (formattedValue.length > 3) return;
    }

    setCardDetails(prev => ({ ...prev, [name]: formattedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      toast({
        title: "Payment Successful!",
        description: "Your bike rental has been confirmed.",
      });
      navigate("/history");
    }, 2000);
  };

  if (!bookingId) {
    return (
      <div className="container max-w-2xl mx-auto p-4 md:p-6">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">No booking selected</p>
          <Button onClick={() => navigate("/map")} className="mt-4">
            Back to Map
          </Button>
        </Card>
      </div>
    );
  }

  if (isBookingLoading) {
    return (
      <div className="container max-w-2xl mx-auto p-4 md:p-6">
        <Card className="p-6 text-center space-y-4">
          <p className="text-muted-foreground">Loading booking details...</p>
        </Card>
      </div>
    );
  }

  if (!bookingDetails) {
    return (
      <div className="container max-w-2xl mx-auto p-4 md:p-6">
        <Card className="p-6 text-center space-y-4">
          <p className="text-muted-foreground">Booking not found</p>
          <Button onClick={() => navigate("/map")} className="mt-4">
            Back to Map
          </Button>
        </Card>
      </div>
    );
  }

  const bike = bookingDetails.bike ?? {};
  const owner = bookingDetails.owner ?? bike.owner ?? {};

  const start = bookingDetails.startTime ? new Date(bookingDetails.startTime) : null;
  const end = bookingDetails.endTime ? new Date(bookingDetails.endTime) : null;

  const durationHours =
    start && end ? Math.max(1, differenceInHours(end, start)) : null;
  const durationDays =
    start && end ? Math.max(1, differenceInDays(end, start)) : null;

  const dailyRate = bike.pricePerDay ?? 0;

  const totalAmount =
    bookingDetails.totalAmount ??
    bookingDetails.price ??
    // totalFromDays ??
    // totalFromHours ??
    0;

  const currency = (bookingDetails.currency ?? "EUR").toUpperCase();

  const startDateLabel = start ? format(start, "PPP") : "N/A";
  const startTimeLabel = start ? format(start, "p") : "";
  const endDateLabel = end ? format(end, "PPP") : "N/A";
  const endTimeLabel = end ? format(end, "p") : "";

  const location =
    bike.location?.[0]?.address ??
    bike.location?.[0]?.street ??
    "Address not available";

  const bikeImage =
    bike.images?.[0]?.url
  return (
    <div className="container max-w-3xl mx-auto p-4 md:p-6">
      <Button
        variant="ghost"
        onClick={() => navigate("/map")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Map
      </Button>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Booking Summary */}
        <Card className="p-6 h-fit">
          <h2 className="text-xl font-bold mb-4">Booking Summary</h2>
          
          {/* Bike Details */}
          <div className="mb-4">
            <img 
              src={bikeImage}
              alt={bike.name ?? "Bike"}
              className="w-full h-40 object-cover rounded-lg mb-3"
            />
            <div className="flex items-center gap-2 mb-2">
              <Bike className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">
                {bike.name ?? "Bike"}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {dailyRate ? `${currency} ${dailyRate}/day` : "Daily rate unavailable"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Owner: {owner.firstName} {owner.lastName ?? ""}
            </p>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {location}
            </p>
          </div>

          <Separator className="my-4" />

          {/* Rental Period */}
          <div className="space-y-3 mb-4">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Start</p>
                <p className="text-sm text-muted-foreground">
                  {startDateLabel}
                  {startTimeLabel ? ` at ${startTimeLabel}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">End</p>
                <p className="text-sm text-muted-foreground">
                  {endDateLabel}
                  {endTimeLabel ? ` at ${endTimeLabel}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Duration</p>
                <p className="text-sm text-muted-foreground">
                  {durationHours
                    ? `${durationHours} hour${durationHours !== 1 ? "s" : ""}`
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Price Breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Rental
                {durationHours ? ` (${durationHours} hour${durationHours !== 1 ? "s" : ""})` : ""}
              </span>
              <span>
                {currency}{" "}
                {Number(totalAmount).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Service fee</span>
              <span>{currency} 0.00</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">
                {currency} {Number(totalAmount).toFixed(2)}
              </span>
            </div>
          </div>
        </Card>

        {/* Payment Form */}
        <Card className="p-6 h-fit">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Payment Details</h1>
            <p className="text-sm text-muted-foreground">Complete your bike rental</p>
          </div>
        </div>
        {(stripePaymentIntent?.clientSecret) ? (
  <Elements stripe={stripePromise} options={{ clientSecret: stripePaymentIntent.clientSecret }}>
    <CheckoutForm bookingDetails={stripePaymentIntent} />
  </Elements>
) : (
  <p>Loading payment form…</p>
)}


        {/* <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <div className="relative">
              <Input
                id="cardNumber"
                name="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={cardDetails.cardNumber}
                onChange={handleInputChange}
                required
                className="pl-10"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <svg className="h-5 w-5 text-muted-foreground" viewBox="0 0 48 32" fill="none">
                  <rect width="48" height="32" rx="4" fill="#1434CB"/>
                  <rect x="13" y="11" width="22" height="10" rx="1" fill="#F7B600"/>
                  <rect x="13" y="11" width="22" height="10" rx="1" fill="url(#visa-gradient)"/>
                  <defs>
                    <linearGradient id="visa-gradient" x1="24" y1="11" x2="24" y2="21" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#F7B600"/>
                      <stop offset="1" stopColor="#F79F00"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardName">Cardholder Name</Label>
            <Input
              id="cardName"
              name="cardName"
              placeholder="JOHN DOE"
              value={cardDetails.cardName}
              onChange={handleInputChange}
              required
              className="uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry Date</Label>
              <Input
                id="expiry"
                name="expiry"
                placeholder="MM/YY"
                value={cardDetails.expiry}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                name="cvv"
                type="password"
                placeholder="123"
                value={cardDetails.cvv}
                onChange={handleInputChange}
                required
                maxLength={3}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-base"
            disabled={isProcessing}
          >
            {isProcessing
              ? "Processing..."
              : `Pay ${currency} ${Number(totalAmount).toFixed(2)}`}
          </Button>
        </form> */}

        <p className="text-xs text-muted-foreground text-center mt-4">
          🔒 Your payment information is encrypted and secure
        </p>
      </Card>
      </div>
    </div>
  );
};

export default Payment;
