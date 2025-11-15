import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  MapPin,
  Star,
  Phone,
  Mail,
  Calendar as CalendarIcon,
  Bike,
  Shield,
  Award,
  Clock,
  Loader2,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { calculatePrice } from "@/services/pricing";
import { api } from "@/lib/api";

interface Owner {
  id: string;
  images: any;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  rating: number;
  totalReviews: number;
  joinedDate: string;
  responseTime: string;
  verifiedOwner: boolean;
  totalBikes: number;
}

interface BikeDetails {
  id: string;
  myBooking: boolean;
  name: string;
  category: {
    name: string;
  };
  status: string;
  pricePerHour:number
  pricePerDay: number;
  location: {
    address: string;
    city: string;
    state: string;
  };
  images: string[];
  description: string;
  condition: string;
  rating: number;
  reviews: number;
  available: boolean;
  features: string[];
  owner: Owner;
}

interface Review {
  id: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
}

const mockReviews: Review[] = [];

const mockOwnerBikes = [
  {
    id: "1",
    name: "Mountain Explorer Pro",
    image: "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=400",
    pricePerHour: 8,
    rating: 4.8,
    category: "Mountain Bike",
  },
  {
    id: "3",
    name: "Road Racer Speed",
    image: "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=400",
    pricePerHour: 10,
    rating: 4.9,
    category: "Road Bike",
  },
  {
    id: "4",
    name: "Hybrid Comfort Plus",
    image: "https://images.unsplash.com/photo-1571333250630-f0230c320b6d?w=400",
    pricePerHour: 7,
    rating: 4.7,
    category: "Hybrid",
  },
  {
    id: "5",
    name: "Electric Cruiser",
    image: "https://images.unsplash.com/photo-1511994298241-608e28f14fde?w=400",
    pricePerHour: 15,
    rating: 4.9,
    category: "E-Bike",
  },
];

const BikeDetails = () => {
  const { bikeId } = useParams();
  const navigate = useNavigate();
  const [bike, setBike] = useState<BikeDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>();
  // Booking dialog state
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  useEffect(() => {
    const fetchBikeDetails = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/bikes/${bikeId}`);
        const bikeDetails = response.data?.data ?? response.data;
        setBike(bikeDetails);
      } catch (error) {
        console.error("Error fetching bike details:", error);
        setBike(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBikeDetails();
  }, [bikeId]);

  // Calculate price when dates change
  useEffect(() => {
    if (!fromDate || !toDate || !bike) {
      setCalculatedPrice(null);
      return;
    }

    const fetchPrice = async () => {
      setIsCalculatingPrice(true);
      try {
        const price = await calculatePrice(
          bike.id,
          fromDate,
          toDate,
          bike.pricePerDay
        );
        setCalculatedPrice(price);
      } catch (error) {
        console.error("Error calculating price:", error);
        toast({
          title: "Error",
          description: "Failed to calculate price. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsCalculatingPrice(false);
      }
    };

    fetchPrice();
  }, [fromDate, toDate, bike]);

  const handleBookNow = () => {
    setShowBookingDialog(true);
  };

  const sendRequest = async () => {
    if (!fromDate || !toDate) {
      toast({
        title: "Missing Information",
        description: "Please select both from and to dates",
        variant: "destructive",
      });
      return;
    }

    // Validate end date is after start date
    if (toDate <= fromDate) {
      toast({
        title: "Invalid Date Range",
        description: "End date must be after start date",
        variant: "destructive",
      });
      return;
    }

    // Set loading state
    setIsSendingRequest(true);

    try {
      // Mock API call with delay
      // await new Promise((resolve) => setTimeout(resolve, 2000));

      // Show success message
      

      // Reset form and close modal
      setFromDate(undefined);
      setToDate(undefined);
      setCalculatedPrice(null);
      setIsCalculatingPrice(false);
      setShowBookingDialog(false);
      
      // Navigate back to map
      navigate("/map");
    } catch (error) {
      toast({
        title: "Request Failed",
        description: "Failed to submit rental request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingRequest(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto p-4 md:p-6">
        <Button variant="ghost" onClick={() => navigate("/map")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Map
        </Button>
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading bike details...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!bike) {
    return (
      <div className="container max-w-6xl mx-auto p-4 md:p-6">
        <Button variant="ghost" onClick={() => navigate("/map")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Map
        </Button>
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">Bike not found</p>
        </Card>
      </div>
    );
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < Math.floor(rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="container max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate("/map")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Map
      </Button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Bike Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Carousel */}
          <Card>
            <CardContent className="p-4">
              <Carousel className="w-full">
                <CarouselContent>
                  {bike?.images.map((image: any, index) => (
                    <CarouselItem key={index}>
                      <div className="aspect-video rounded-lg overflow-hidden">
                        <img
                          src={image?.url}
                          alt={`${bike.name} - ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {bike?.images.length > 1 && (
                  <>
                    <CarouselPrevious className="left-4" />
                    <CarouselNext className="right-4" />
                  </>
                )}
              </Carousel>
            </CardContent>
          </Card>

          {/* Bike Info */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">{bike?.name}</h1>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {bike?.location.address}, {bike?.location.city}, {bike?.location.state}
                  </p>
                </div>
                <Badge
                  variant={bike?.status?.toUpperCase() === "AVAILABLE" ? "default" : "secondary"}
                  className="shrink-0"
                >
                  {bike?.status?.toUpperCase()}
                </Badge>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <Badge variant="outline">{bike?.category?.name}</Badge>
                <Badge variant="outline">{bike.condition}</Badge>
                <div className="flex items-center gap-1">
                  {renderStars(bike.rating)}
                  <span className="text-sm font-medium ml-1">
                    {bike.rating} ({bike.reviews} reviews)
                  </span>
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-3xl font-bold text-primary mb-1">
                  EUR {bike?.pricePerDay}
                  <span className="text-lg font-normal text-muted-foreground">/DAY</span>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{bike.description}</p>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Features</h3>
                <div className="grid grid-cols-2 gap-2">
                  {bike?.features && bike?.features?.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              { !bike?.myBooking && (
                  <div>
                      <Button size="lg" className="w-full mt-4" onClick={handleBookNow}>
                    Book Now
                  </Button>
                  </div>
              )}
              { bike?.myBooking && (
                <div>
                  <Button size="lg" disabled className="w-full mt-4">
                    Booking Made
                  </Button>
                </div>
              )}
            
            </CardContent>
          </Card>

          {/* Reviews Section */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Reviews ({reviews.length})</h2>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="space-y-2">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={review.userAvatar} alt={review.userName} />
                        <AvatarFallback>{review.userName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">{review.userName}</p>
                          <span className="text-xs text-muted-foreground">{review.date}</span>
                        </div>
                        {renderStars(review.rating)}
                        <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
                      </div>
                    </div>
                    <Separator className="mt-4" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Owner Details & Other Bikes */}
        <div className="space-y-6">
          {/* Owner Profile */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-bold">Owner Details</h2>
              <Separator />

              <div className="flex items-center gap-3">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={bike.owner?.avatar} alt={bike.owner.name} />
                  <AvatarFallback>{bike.owner.name}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{bike.owner.name}</h3>
                    {bike.owner?.verifiedOwner && (
                      <Shield className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{bike.owner?.rating}</span>
                    <span className="text-xs text-muted-foreground">
                      ({bike.owner?.totalReviews} reviews)
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Responds {bike.owner.responseTime}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Bike className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {bike.owner.totalBikes} bikes listed
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Verified Owner</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Button variant="outline" className="w-full" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Owner
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Owner
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Owner's Other Bikes */}
          {/* <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-bold">Owner's Other Bikes</h2>
              <Separator />

              <div className="space-y-3">
                {ownerBikes.map((ownerBike) => (
                  <Card
                    key={ownerBike.id}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => navigate(`/bike/${ownerBike.id}`)}
                  >
                    <CardContent className="p-3">
                      <div className="flex gap-3">
                        <img
                          src={ownerBike.image}
                          alt={ownerBike.name}
                          className="w-20 h-20 rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">
                            {ownerBike.name}
                          </h4>
                          <p className="text-xs text-muted-foreground mb-1">
                            {ownerBike.category}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-primary">
                              ${ownerBike.pricePerHour}/hr
                            </span>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs">{ownerBike.rating}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card> */}
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Book {bike?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !fromDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fromDate ? format(fromDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={fromDate}
                      onSelect={setFromDate}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !toDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {toDate ? format(toDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={toDate}
                      onSelect={setToDate}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      className="pointer-events-auto"
                      modifiers={fromDate ? { startDate: fromDate } : undefined}
                      modifiersClassNames={{
                        startDate: "bg-primary/20 text-primary font-semibold ring-1 ring-primary"
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Price Display */}
            {fromDate && toDate && (
              <div className="p-4 bg-muted rounded-lg">
                {isCalculatingPrice ? (
                  <div className="flex justify-center items-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2 text-sm text-muted-foreground">Calculating price...</span>
                  </div>
                ) : calculatedPrice !== null ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Price per hour:</span>
                      <span className="font-medium">${bike?.pricePerHour}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">
                        {Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))} days
                      </span>
                    </div>
                    <Separator className="my-2" />
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Total Price:</span>
                        <span className="text-2xl font-bold text-primary">${calculatedPrice}</span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            <Button 
              className="w-full"
              onClick={sendRequest}
              disabled={!fromDate || !toDate || isSendingRequest || calculatedPrice === null || calculatedPrice === 0}
            >
              {isSendingRequest ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending Request...
                </>
              ) : (
                "Send Request"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BikeDetails;
