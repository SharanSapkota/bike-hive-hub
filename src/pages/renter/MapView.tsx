import { useEffect, useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Star } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyBHwNVP7Bp6AN2TbOQBLVrLx_yfeYdF6dc";

interface Bike {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  city: string;
  state: string;
  pricePerHour: number;
  category: string;
  available: boolean;
  image?: string;
  images?: string[];
  condition?: string;
  reviews?: number;
  rating?: number;
}

// Mock data - will be replaced with API call
const mockBikes: Bike[] = [
  {
    id: "1",
    name: "Mountain Explorer Pro",
    location: { lat: 65.0593, lng: 25.4663 },
    city: "Oulu",
    state: "NY",
    pricePerHour: 8,
    category: "Mountain",
    available: true,
    images: ["https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=400", "https://images.unsplash.com/photo-1511994298241-608e28f14fde?w=400"],
    condition: "Excellent",
    reviews: 24,
    rating: 4.8,
  },
  {
    id: "2",
    name: "City Cruiser Deluxe",
    location: { lat: 40.7138, lng: -74.008 },
    city: "New York",
    state: "NY",
    pricePerHour: 5,
    category: "City",
    available: true,
    images: ["https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400"],
    condition: "Good",
    reviews: 18,
    rating: 4.5,
  },
  {
    id: "3",
    name: "Road Racer Speed",
    location: { lat: 40.7118, lng: -74.004 },
    city: "New York",
    state: "NY",
    pricePerHour: 10,
    category: "Road",
    available: true,
    images: ["https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=400", "https://images.unsplash.com/photo-1571333250630-f0230c320b6d?w=400"],
    condition: "Excellent",
    reviews: 32,
    rating: 4.9,
  },
  {
    id: "4",
    name: "Electric Bolt",
    location: { lat: 40.7158, lng: -74.009 },
    city: "New York",
    state: "NY",
    pricePerHour: 12,
    category: "Electric",
    available: true,
    images: ["https://images.unsplash.com/photo-1559348349-86f1f65817fe?w=400"],
    condition: "Excellent",
    reviews: 41,
    rating: 4.9,
  },
  {
    id: "5",
    name: "Hybrid Comfort",
    location: { lat: 40.7098, lng: -74.003 },
    city: "New York",
    state: "NY",
    pricePerHour: 7,
    category: "Hybrid",
    available: true,
    images: ["https://images.unsplash.com/photo-1571333250630-f0230c320b6d?w=400"],
    condition: "Good",
    reviews: 15,
    rating: 4.3,
  },
  {
    id: "6",
    name: "Mountain Trail",
    location: { lat: 40.7108, lng: -74.007 },
    city: "New York",
    state: "NY",
    pricePerHour: 9,
    category: "Mountain",
    available: true,
    images: ["https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=400"],
    condition: "Very Good",
    reviews: 28,
    rating: 4.7,
  },
  {
    id: "7",
    name: "City Commuter",
    location: { lat: 40.7148, lng: -74.005 },
    city: "New York",
    state: "NY",
    pricePerHour: 6,
    category: "City",
    available: true,
    images: ["https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400"],
    condition: "Good",
    reviews: 12,
    rating: 4.4,
  },
  {
    id: "8",
    name: "Electric Cruiser",
    location: { lat: 40.7168, lng: -74.0065 },
    city: "New York",
    state: "NY",
    pricePerHour: 11,
    category: "Electric",
    available: true,
    images: ["https://images.unsplash.com/photo-1559348349-86f1f65817fe?w=400", "https://images.unsplash.com/photo-1571333250630-f0230c320b6d?w=400"],
    condition: "Excellent",
    reviews: 36,
    rating: 4.8,
  },
];

const containerStyle = {
  width: "100%",
  height: "100%",
};

const MapView = () => {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const [bikes, setBikes] = useState<Bike[]>(mockBikes);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState({ lat: 40.7128, lng: -74.006 });
  const [selectedBike, setSelectedBike] = useState<Bike | null>(null);

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        },
      );
    }

    // TODO: Fetch bikes from API
    // api.get('/bikes/nearby').then(response => setBikes(response.data));
  }, []);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleCenterOnUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCenter(newCenter);
          if (map) {
            map.panTo(newCenter);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        },
      );
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-2rem)] rounded-lg bg-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-2rem)] rounded-lg overflow-hidden">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {bikes.map((bike) => (
          <Marker
            key={bike.id}
            position={bike.location}
            onClick={() => setSelectedBike(bike)}
            icon={{
              url:
                "data:image/svg+xml;charset=UTF-8," +
                encodeURIComponent(`
                <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="18" fill="#14b8a6" stroke="white" stroke-width="2"/>
                  <text x="20" y="26" font-size="20" text-anchor="middle" fill="white">🚲</text>
                </svg>
              `),
              scaledSize: new google.maps.Size(40, 40),
            }}
          />
        ))}
      </GoogleMap>

      {/* Floating controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Button size="icon" onClick={handleCenterOnUser} className="bg-card shadow-lg hover:bg-card/90">
          <Navigation className="h-5 w-5" />
        </Button>
      </div>

      {/* Available bikes count */}
      <Card className="absolute top-4 left-4 z-10 shadow-lg">
        <div className="p-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold text-sm">{bikes.length}</span>
          </div>
          <span className="text-sm font-medium">Available Bikes</span>
        </div>
      </Card>

      {/* Selected bike card (mobile-friendly bottom card) */}
      {selectedBike && (
        <Card className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-10 shadow-lg">
          <button
            onClick={() => setSelectedBike(null)}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted z-10"
            aria-label="Close"
          >
            <span className="text-lg">×</span>
          </button>
          <div className="p-4">
            {/* Image Carousel */}
            {selectedBike.images && selectedBike.images.length > 0 && (
              <Carousel className="w-full mb-4">
                <CarouselContent>
                  {selectedBike.images.map((image, index) => (
                    <CarouselItem key={index}>
                      <div className="aspect-video rounded-lg overflow-hidden">
                        <img src={image} alt={`${selectedBike.name} - ${index + 1}`} className="w-full h-full object-cover" />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {selectedBike.images.length > 1 && (
                  <>
                    <CarouselPrevious className="left-2" />
                    <CarouselNext className="right-2" />
                  </>
                )}
              </Carousel>
            )}

            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{selectedBike.name}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {selectedBike.city}, {selectedBike.state}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedBike.category} Bike</p>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                Available
              </Badge>
            </div>

            {/* Condition and Reviews */}
            <div className="flex items-center gap-4 mb-4 text-sm">
              {selectedBike.condition && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Condition:</span>
                  <span className="font-medium">{selectedBike.condition}</span>
                </div>
              )}
              {selectedBike.rating && selectedBike.reviews && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{selectedBike.rating}</span>
                  <span className="text-muted-foreground">({selectedBike.reviews})</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-primary">${selectedBike.pricePerHour}</p>
                <p className="text-xs text-muted-foreground">per hour</p>
              </div>
              <Button className="bg-gradient-primary hover:opacity-90">Rent Now</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default MapView;
