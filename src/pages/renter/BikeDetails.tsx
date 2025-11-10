import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  MapPin,
  Star,
  Phone,
  Mail,
  Calendar,
  Bike,
  Shield,
  Award,
  Clock,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface Owner {
  id: string;
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
  name: string;
  category: string;
  pricePerHour: number;
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

// Mock data - replace with API calls
const mockBikeDetails: Record<string, BikeDetails> = {
  "1": {
    id: "1",
    name: "Mountain Explorer Pro",
    category: "Mountain Bike",
    pricePerHour: 8,
    location: {
      address: "123 Adventure Lane",
      city: "Denver",
      state: "CO",
    },
    images: [
      "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800",
      "https://images.unsplash.com/photo-1571333250630-f0230c320b6d?w=800",
      "https://images.unsplash.com/photo-1511994298241-608e28f14fde?w=800",
    ],
    description: "Premium mountain bike perfect for trail adventures. Features full suspension, 29-inch wheels, and hydraulic disc brakes. Ideal for both beginners and experienced riders.",
    condition: "Excellent",
    rating: 4.8,
    reviews: 24,
    available: true,
    features: [
      "Full Suspension",
      "29-inch Wheels",
      "Hydraulic Disc Brakes",
      "21-Speed Shimano",
      "Aluminum Frame",
      "Adjustable Seat",
    ],
    owner: {
      id: "owner-1",
      name: "John Smith",
      email: "john.smith@example.com",
      phone: "+1 (555) 123-4567",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
      rating: 4.9,
      totalReviews: 87,
      joinedDate: "January 2023",
      responseTime: "Within 1 hour",
      verifiedOwner: true,
      totalBikes: 5,
    },
  },
  "2": {
    id: "2",
    name: "City Cruiser Deluxe",
    category: "City Bike",
    pricePerHour: 6,
    location: {
      address: "456 Urban Street",
      city: "Portland",
      state: "OR",
    },
    images: [
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800",
      "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=800",
    ],
    description: "Comfortable city bike with upright riding position. Perfect for commuting and leisurely rides around town.",
    condition: "Very Good",
    rating: 4.6,
    reviews: 18,
    available: true,
    features: [
      "Comfort Seat",
      "7-Speed",
      "Front Basket",
      "LED Lights",
      "Fenders",
      "Kickstand",
    ],
    owner: {
      id: "owner-2",
      name: "Sarah Johnson",
      email: "sarah.j@example.com",
      phone: "+1 (555) 234-5678",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      rating: 4.7,
      totalReviews: 52,
      joinedDate: "March 2023",
      responseTime: "Within 2 hours",
      verifiedOwner: true,
      totalBikes: 3,
    },
  },
};

const mockReviews: Review[] = [
  {
    id: "1",
    userName: "Mike Wilson",
    userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
    rating: 5,
    comment: "Great bike! Owner was very responsive and the bike was in excellent condition. Highly recommend!",
    date: "2 days ago",
  },
  {
    id: "2",
    userName: "Emily Chen",
    userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
    rating: 4,
    comment: "Good experience overall. The bike performed well on trails. Would rent again.",
    date: "1 week ago",
  },
  {
    id: "3",
    userName: "David Brown",
    userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    rating: 5,
    comment: "Amazing bike and owner! Everything was perfect from start to finish.",
    date: "2 weeks ago",
  },
];

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
  const [reviews, setReviews] = useState<Review[]>(mockReviews);
  const [ownerBikes, setOwnerBikes] = useState(mockOwnerBikes);

  useEffect(() => {
    // Simulate API call
    if (bikeId && mockBikeDetails[bikeId]) {
      setBike(mockBikeDetails[bikeId]);
    }
  }, [bikeId]);

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
                  {bike.images.map((image, index) => (
                    <CarouselItem key={index}>
                      <div className="aspect-video rounded-lg overflow-hidden">
                        <img
                          src={image}
                          alt={`${bike.name} - ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {bike.images.length > 1 && (
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
                  <h1 className="text-3xl font-bold mb-2">{bike.name}</h1>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {bike.location.address}, {bike.location.city}, {bike.location.state}
                  </p>
                </div>
                <Badge
                  variant={bike.available ? "default" : "secondary"}
                  className="shrink-0"
                >
                  {bike.available ? "Available" : "Unavailable"}
                </Badge>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <Badge variant="outline">{bike.category}</Badge>
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
                  ${bike.pricePerHour}
                  <span className="text-lg font-normal text-muted-foreground">/hour</span>
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
                  {bike.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button size="lg" className="w-full mt-4">
                Book Now
              </Button>
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
                  <AvatarImage src={bike.owner.avatar} alt={bike.owner.name} />
                  <AvatarFallback>{bike.owner.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{bike.owner.name}</h3>
                    {bike.owner.verifiedOwner && (
                      <Shield className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{bike.owner.rating}</span>
                    <span className="text-xs text-muted-foreground">
                      ({bike.owner.totalReviews} reviews)
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Joined {bike.owner.joinedDate}</span>
                </div>
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
          <Card>
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
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BikeDetails;
