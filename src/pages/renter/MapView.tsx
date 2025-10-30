import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation } from 'lucide-react';

// Fix for default marker icons in react-leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface Bike {
  id: string;
  name: string;
  location: [number, number];
  pricePerHour: number;
  category: string;
  available: boolean;
  image?: string;
}

// Mock data - will be replaced with API call
const mockBikes: Bike[] = [
  {
    id: '1',
    name: 'Mountain Explorer',
    location: [40.7128, -74.006],
    pricePerHour: 8,
    category: 'Mountain',
    available: true,
  },
  {
    id: '2',
    name: 'City Cruiser',
    location: [40.7138, -74.008],
    pricePerHour: 5,
    category: 'City',
    available: true,
  },
  {
    id: '3',
    name: 'Road Racer',
    location: [40.7118, -74.004],
    pricePerHour: 10,
    category: 'Road',
    available: true,
  },
];

const RecenterMap = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
};

const MapView = () => {
  const [bikes, setBikes] = useState<Bike[]>(mockBikes);
  const [userLocation, setUserLocation] = useState<[number, number]>([40.7128, -74.006]);
  const [selectedBike, setSelectedBike] = useState<Bike | null>(null);

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }

    // TODO: Fetch bikes from API
    // api.get('/bikes/nearby').then(response => setBikes(response.data));
  }, []);

  const handleCenterOnUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
      });
    }
  };

  return (
    <div className="relative h-[calc(100vh-2rem)] rounded-lg overflow-hidden">
      <MapContainer
        center={userLocation}
        zoom={13}
        className="h-full w-full z-0"
        zoomControl={true}
      >
        <RecenterMap center={userLocation} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {bikes.map((bike) => (
          <Marker
            key={bike.id}
            position={bike.location}
            eventHandlers={{
              click: () => setSelectedBike(bike),
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold">{bike.name}</h3>
                <p className="text-sm text-muted-foreground">{bike.category}</p>
                <p className="font-bold text-primary mt-1">${bike.pricePerHour}/hr</p>
                <Button size="sm" className="mt-2 w-full">
                  Rent Now
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Button
          size="icon"
          onClick={handleCenterOnUser}
          className="bg-card shadow-lg hover:bg-card/90"
        >
          <Navigation className="h-5 w-5" />
        </Button>
      </div>

      {/* Selected bike card */}
      {selectedBike && (
        <Card className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-10 shadow-lg">
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">{selectedBike.name}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {selectedBike.category} Bike
                </p>
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
              <Button className="bg-gradient-primary hover:opacity-90">
                Rent Now
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Available bikes count */}
      <Card className="absolute top-4 left-4 z-10 shadow-lg">
        <div className="p-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold text-sm">{bikes.length}</span>
          </div>
          <span className="text-sm font-medium">Available Bikes</span>
        </div>
      </Card>
    </div>
  );
};

export default MapView;
