import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleMap, Marker, Autocomplete } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Navigation, Star, X, Search, Loader2, CalendarIcon } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useGoogleMaps } from "@/contexts/GoogleMapsContext";
import api from "@/lib/api";
import { getBikeDetails } from "@/services/bike";
import { normalizeBike } from "@/lib/bike";
import { toast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";
import { createBooking } from "@/services/booking";

interface Bike {
  id: string;
  name: string;
  location: { lat: number; lng: number, city: string, state: string };
  // city: string;
  // state: string;
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
    location: { lat: 65.0593, lng: 25.4663, city: "Oulu", state: "Oulu" },
    // city: "Oulu",
    // state: "NY",
    pricePerHour: 8,
    category: "Mountain",
    available: true,
    images: [
      "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=400",
      "https://images.unsplash.com/photo-1511994298241-608e28f14fde?w=400",
    ],
    condition: "Excellent",
    reviews: 24,
    rating: 4.8,
  },
  {
    id: "2",
    name: "City Cruiser Deluxe",
    location: { lat: 65.0591, lng: 25.4653, city: "Oulu", state: "Oulu" },
    // city: "Oulu",
    // state: "NY",
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
    location: { lat: 65.1591, lng: 25.465, city: "Oulu", state: "Oulu" },
    // city: "New York",
    // state: "NY",
    pricePerHour: 10,
    category: "Road",
    available: true,
    images: [
      "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=400",
      "https://images.unsplash.com/photo-1571333250630-f0230c320b6d?w=400",
    ],
    condition: "Excellent",
    reviews: 32,
    rating: 4.9,
  },
  {
    id: "4",
    name: "Electric Bolt",
    location: { lat: 40.7158, lng: -74.009, city: "New York", state: "NY" },
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
    location: { lat: 40.7098, lng: -74.003, city: "New York", state: "NY" },
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
    location: { lat: 40.7108, lng: -74.007, city: "New York", state: "NY" },
    // state: "NY",
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
    location: { lat: 40.7148, lng: -74.005, city: "New York", state: "NY" },
    // city: "New York",
    // state: "NY",
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
    location: { lat: 40.7168, lng: -74.0065, city: "New York", state: "NY" },
    pricePerHour: 11,
    category: "Electric",
    available: true,
    images: [
      "https://images.unsplash.com/photo-1559348349-86f1f65817fe?w=400",
      "https://images.unsplash.com/photo-1571333250630-f0230c320b6d?w=400",
    ],
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
  const navigate = useNavigate();
  const { isLoaded, loadError } = useGoogleMaps();

  const [bikes, setBikes] = useState<Bike[]>([]);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState({ lat: 40.7128, lng: -74.006 });
  const [selectedBike, setSelectedBike] = useState<Bike | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string>("");
  const [searchValue, setSearchValue] = useState<string>("");
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  
  // Booking dialog state
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();

  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({
        location: { lat, lng },
      });

      if (response.results[0]) {
        const address = response.results[0].formatted_address;
        setCurrentAddress(address);
        // Cache the address
        sessionStorage.setItem('userAddress', address);
      }
    } catch (error) {
      console.error("Error getting address:", error);
    }
  };

  const getBikes = async () => {
    try {
      // const response = await api.get("/bikes");
      const response = {data:{data: mockBikes}};
      const payload = response?.data;
      const bikeList = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
        ? payload
        : [];

      if (!Array.isArray(payload?.data) && !Array.isArray(payload)) {
        console.warn("Unexpected bikes response shape:", payload);
      }

      if(!bikeList || bikeList?.length == 0) {
        setBikes(mockBikes);
        return;
      } else {
      setBikes(bikeList);
      }
    } catch (error) {
      console.error("Failed to fetch bikes:", error);
    }
  };

  useEffect(() => {
    // const fetchData = async () => {
    //   await getBikes();
    // }
    // fetchData();
    // Check if we have a cached location
    const cachedLocation = sessionStorage.getItem('userLocation');
    const cachedAddress = sessionStorage.getItem('userAddress');
    
    if (cachedLocation && cachedAddress) {
      // Use cached location - no loading needed
      const location = JSON.parse(cachedLocation);
      setCenter(location);
      setCurrentAddress(cachedAddress);
      setIsLoadingLocation(false);
      getBikes();
      return;
    }

    // Get user's current location only if not cached
    if (navigator.geolocation) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const newCenter = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCenter(newCenter);
          
          // Cache the location
          sessionStorage.setItem('userLocation', JSON.stringify(newCenter));
          
          // Get address from coordinates
          await getAddressFromCoordinates(newCenter.lat, newCenter.lng);
          setIsLoadingLocation(false);
          
          // Load bikes after location is set
          getBikes();
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLoadingLocation(false);
          // Load bikes even if location fails
          getBikes();
        },
      );
    } else {
      setIsLoadingLocation(false);
      // Load bikes even if geolocation not supported
      getBikes();
    }

  }, []);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const sendRequest = async() => {
  
      if (!fromDate || !toDate) {
        toast({
          title: "Missing Information",
          description: "Please select both from and to dates",
          variant: "destructive",
        });
        return;
      }

      // Validate end date is after start date
      if (toDate < fromDate) {
        toast({
          title: "Invalid Date Range",
          description: "To date must be after from date",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Request Sent",
        description: "Your rental request has been submitted successfully",
      });
      
      const startDateStr = format(fromDate, "yyyy-MM-dd");
      const endDateStr = format(toDate, "yyyy-MM-dd");
      const booking = await createBooking({bike: selectedBike.id, startDate: startDateStr, endDate: endDateStr})
      
      // Reset form
      setFromDate(undefined);
      setToDate(undefined);
      setShowBookingDialog(false);
      setSelectedBike(null);
      setPopupPosition(null);
    
  }

  const handleMarkerClick = useCallback(async (bike: Bike) => {
    // setSelectedBike(bike);
    console.log(bike);
    // setIsLoadingDetails(true);
    // const bikeDetails = await getBikeDetails(bike.id);
    setSelectedBike(bike);
    // setSelectedBike(normalizeBike(bikeDetails));
    // Mock timeout to simulate  API call
    setTimeout(() => {
      setIsLoadingDetails(false);
    }, 1000);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  useEffect(() => {
    if (map && selectedBike) {
      const updatePopupPosition = () => {
        const overlay = new google.maps.OverlayView();

        overlay.onAdd = function () {};

        overlay.draw = function () {
          const projection = this.getProjection();
          if (projection) {
            const point = projection.fromLatLngToContainerPixel(
              new google.maps.LatLng(selectedBike?.location?.lat, selectedBike?.location?.lng),
            );

            if (point) {
              const mapContainer = map.getDiv().getBoundingClientRect();
              setPopupPosition({
                x: mapContainer.left + point.x,
                y: mapContainer.top + point.y,
              });
            }
          }
        };

        overlay.setMap(map);

        // Cleanup
        setTimeout(() => {
          overlay.setMap(null);
        }, 100);
      };

      updatePopupPosition();

      const zoomListener = map.addListener("zoom_changed", updatePopupPosition);
      const centerListener = map.addListener("center_changed", updatePopupPosition);

      return () => {
        google.maps.event.removeListener(zoomListener);
        google.maps.event.removeListener(centerListener);
      };
    }
  }, [map, selectedBike]);

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

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry?.location) {
        const newCenter = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setCenter(newCenter);
        setSearchValue(place.formatted_address || "");
        setCurrentAddress(place.formatted_address || "");
        
        if (map) {
          map.panTo(newCenter);
          map.setZoom(14);
        }
      }
    }
  };

  const onAutocompleteLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  // Removed the early return for loading state - now showing map with overlay

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-2rem)] rounded-lg bg-muted">
        <div className="text-center">
          <p className="text-destructive font-medium mb-2">Error loading maps</p>
          <p className="text-muted-foreground text-sm">Please refresh the page</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-2rem)] rounded-lg bg-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-foreground font-semibold text-lg">Loading map...</p>
          <p className="text-muted-foreground text-sm mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-2rem)] rounded-lg overflow-hidden">
      {/* Loading Overlay */}
      {isLoadingLocation && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-foreground font-semibold text-lg">Getting your location...</p>
            <p className="text-muted-foreground text-sm mt-2">Please wait</p>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4">
        <Card className="shadow-xl">
          <div className="flex items-center gap-2 p-3">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <Autocomplete
              onLoad={onAutocompleteLoad}
              onPlaceChanged={onPlaceChanged}
              options={{
                fields: ["formatted_address", "geometry", "name"],
              }}
            >
              <Input
                type="text"
                placeholder="Search for a location..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
              />
            </Autocomplete>
          </div>
        </Card>
      </div>

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
        {bikes.map((bike) => {
          const isSelected = selectedBike?.id === bike.id;
          return (
            <Marker
              key={bike.id}
              position={bike.location}
              onClick={() => handleMarkerClick(bike)}
              icon={{
                url:
                  "data:image/svg+xml;charset=UTF-8," +
                  encodeURIComponent(`
                  <svg width="${isSelected ? 56 : 40}" height="${isSelected ? 56 : 40}" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
                    ${isSelected ? '<circle cx="28" cy="28" r="26" fill="#14b8a6" opacity="0.3"><animate attributeName="r" values="26;30;26" dur="1.5s" repeatCount="indefinite"/></circle>' : ""}
                    <circle cx="28" cy="28" r="22" fill="#14b8a6" stroke="white" stroke-width="${isSelected ? 3 : 2}"/>
                    <text x="28" y="${isSelected ? 36 : 34}" font-size="${isSelected ? 26 : 24}" text-anchor="middle" fill="white">🚲</text>
                  </svg>
                `),
                scaledSize: new google.maps.Size(isSelected ? 56 : 40, isSelected ? 56 : 40),
                anchor: new google.maps.Point(isSelected ? 28 : 20, isSelected ? 28 : 20),
              }}
              zIndex={isSelected ? 1000 : 1}
            />
          );
        })}
      </GoogleMap>

      {/* Floating controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Button size="icon" onClick={handleCenterOnUser} className="bg-card shadow-lg hover:bg-card/90">
          <Navigation className="h-5 w-5" />
        </Button>
      </div>

      {/* Current location and bikes count */}
      <div className="absolute top-20 left-4 z-10 space-y-2">
        {currentAddress && (
          <Card className="shadow-lg">
            <div className="p-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-medium line-clamp-1">{currentAddress}</span>
            </div>
          </Card>
        )}
        <Card className="shadow-lg">
          <div className="p-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-sm">{bikes.length}</span>
            </div>
            <span className="text-sm font-medium">Available Products</span>
          </div>
        </Card>
      </div>

      {/* Anchored popup emerging from marker */}
      {selectedBike && popupPosition && (
        <div
          className="fixed z-20 animate-scale-in pointer-events-none px-2"
          style={{
            left: `${Math.min(Math.max(popupPosition.x, 100), window.innerWidth - 100)}px`,
            top: `${Math.max(popupPosition.y, 200)}px`,
            transform: "translate(-50%, calc(-100% - 35px))",
            maxWidth: "calc(100vw - 16px)",
          }}
        >
          {/* Arrow pointing to marker */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full">
            <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-card"></div>
          </div>

          <Card className="w-[180px] sm:w-[200px] shadow-xl pointer-events-auto max-h-[45vh] sm:max-h-[50vh] overflow-y-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedBike(null);
                setPopupPosition(null);
                setIsLoadingDetails(false);
              }}
              className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full z-10 bg-background/90 hover:bg-background"
              aria-label="Close"
            >
              <X className="h-2.5 w-2.5" />
            </Button>
            
            {isLoadingDetails ? (
              <div className="p-2 sm:p-3 flex items-center justify-center min-h-[120px] sm:min-h-[150px]">
                <div className="text-center">
                  <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary mx-auto mb-1 sm:mb-2" />
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground">Loading...</p>
                </div>
              </div>
            ) : (
              <div className="p-1 sm:p-1.5">
                {/* Image Carousel */}
                {selectedBike?.images && selectedBike?.images.length > 0 && (
                  <Carousel className="w-full mb-1 sm:mb-1.5">
                    <CarouselContent>
                      {selectedBike?.images.map((image, index) => (
                        <CarouselItem key={index}>
                          <div className="aspect-video rounded overflow-hidden">
                            <img
                              src={image}
                              alt={`${selectedBike?.name} - ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {selectedBike.images.length > 1 && (
                      <>
                        <CarouselPrevious className="left-0.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <CarouselNext className="right-0.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </>
                    )}
                  </Carousel>
                )}

                <div className="mb-1 sm:mb-1.5">
                  <div className="flex items-start justify-between gap-1 mb-0.5">
                    <h3 className="font-semibold text-[11px] sm:text-xs leading-tight flex-1">{selectedBike.name}</h3>
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary text-[8px] sm:text-[9px] px-1 py-0 shrink-0 h-3.5"
                    >
                      Available
                    </Badge>
                  </div>
                  <p className="text-[8px] sm:text-[9px] text-muted-foreground flex items-center gap-0.5">
                    <MapPin className="h-2 w-2" />
                    {selectedBike?.location?.city}, {selectedBike?.location?.state} • {selectedBike?.category}
                  </p>
                </div>

                {/* Condition and Reviews */}
                <div className="flex items-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-2 text-[8px] sm:text-[9px]">
                  {selectedBike?.condition && <span className="text-muted-foreground">{selectedBike?.condition}</span>}
                  {selectedBike?.rating && selectedBike?.reviews && (
                    <div className="flex items-center gap-0.5">
                      <Star className="h-2 w-2 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{selectedBike?.rating}</span>
                      <span className="text-muted-foreground">({selectedBike?.reviews})</span>
                    </div>
                  )}
                </div>

                {/* Price */}
                {/* <div className="mb-1.5 sm:mb-2 pb-1.5 sm:pb-2 border-b">
                  <p className="text-sm sm:text-base font-bold text-primary leading-none">${selectedBike.pricePerHour}</p>
                  <p className="text-[7px] sm:text-[8px] text-muted-foreground">per hour</p>
                </div> */}

                {/* Book Now Button */}
                <Button 
                  className="w-full h-6 sm:h-7 text-[9px] sm:text-[10px]"
                  onClick={() => setShowBookingDialog(true)}
                >
                  Book Now
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Book {selectedBike?.name}</DialogTitle>
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
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Price Display */}
            {fromDate && toDate && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Calculating price...</span>
                </div>
              </div>
            )}

            <Button 
              className="w-full"
              onClick={sendRequest}
              disabled={!fromDate || !toDate}
            >
              Send Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MapView;
