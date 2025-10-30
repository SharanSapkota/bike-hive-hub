import { useEffect, useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation } from "lucide-react";

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

        {selectedBike && (
          <InfoWindow position={selectedBike.location} onCloseClick={() => setSelectedBike(null)}>
            <div className="p-2 min-w-[200px]">
              <h3 className="font-semibold text-lg mb-1">{selectedBike.name}</h3>
              <p className="text-sm text-gray-600 mb-1">{selectedBike.category}</p>
              <p className="text-xs text-gray-500 mb-2">
                {selectedBike.city}, {selectedBike.state}
              </p>
              <p className="font-bold text-teal-600 mb-2">${selectedBike.pricePerHour}/hr</p>
              <button
                className="w-full px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg text-sm font-medium hover:opacity-90"
                onClick={() => alert("Rental feature coming soon!")}
              >
                Rent Now
              </button>
            </div>
          </InfoWindow>
        )}
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
        <Card className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-10 shadow-lg">
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
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
