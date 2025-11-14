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
import { calculatePrice } from "@/services/pricing";

interface Bike {
  id: string;
  name: string;
  location: { lat: number; lng: number, city: string, state: string };
  // city: string;
  // state: string;
  pricePerDay?: number;
  pricePerHour: number;
  category: string;
  available: boolean;
  image?: string;
  images?: string[];
  condition?: string;
  reviews?: number;
  rating?: number;
  myBooking?: boolean;
}

// Mock data - will be replaced with API call

const containerStyle = {
  width: "100%",
  height: "100%",
};

const MapView = () => {
  const navigate = useNavigate();
  const { isLoaded, loadError } = useGoogleMaps();

  const [bikes, setBikes] = useState<Bike[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [myBookings, setMyBookings] = useState<[]>([]);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState({ lat: 40.7128, lng: -74.006 });
  const [selectedBike, setSelectedBike] = useState<Bike | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isMyLoadingLocation, setIsMyLoadingLocation] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string>("");
  const [searchValue, setSearchValue] = useState<string>("");
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  
  // Booking dialog state
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [isSendingRequest, setIsSendingRequest] = useState(false);

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

   const getMyBookings = useCallback(async () => {
    try {
      const response = await api.get("/bookings/my");
      const bookings = response?.data?.data;
      setMyBookings(bookings);
    } catch (error) {
      console.error("Error getting my bookings:", error);
    }
  }, []);

  const getBikes = useCallback(async (coords?: { lat: number; lng: number }) => {
    try {
      const params = coords
        ? {
            lat: coords.lat,
            lng: coords.lng,
            latitude: coords.lat,
            longitude: coords.lng,
          }
        : undefined;

      const response = await api.get("/bikes", params ? { params } : undefined);
      const payload = response?.data;
      const bikeList = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
        ? payload
        : [];

      if (!Array.isArray(payload?.data) && !Array.isArray(payload)) {
        console.warn("Unexpected bikes response shape:", payload);
      }

      if (!bikeList || bikeList.length === 0) {
        setBikes([]);
        return;
      }

      const normalized = bikeList.map((bike: any) => normalizeBike(bike));
      setBikes(normalized);
    } catch (error) {
      console.error("Failed to fetch bikes:", error);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    // Check if we have a cached location
    const cachedLocation = sessionStorage.getItem('userLocation');
    const cachedAddress = sessionStorage.getItem('userAddress');
    
    if (cachedLocation && cachedAddress) {
      // Use cached location - no loading needed
      const location = JSON.parse(cachedLocation);
      setCenter(location);
      setUserLocation(location);
      setCurrentAddress(cachedAddress);
      setIsLoadingLocation(false);
      getBikes(location);
      getMyBookings()
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
          setUserLocation(newCenter);
          
          // Cache the location
          sessionStorage.setItem('userLocation', JSON.stringify(newCenter));
          
          // Get address from coordinates
          await getAddressFromCoordinates(newCenter.lat, newCenter.lng);
          setIsLoadingLocation(false);
          
          // Load bikes after location is set
          getBikes(newCenter);
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

  }, [getBikes, isLoaded]);

  // Calculate price when dates change
  useEffect(() => {
    const fetchPrice = async () => {
      if (fromDate && toDate && selectedBike) {
        setIsCalculatingPrice(true);
        setCalculatedPrice(null);
        try {
          const price = await calculatePrice(
            selectedBike.id,
            fromDate,
            toDate,
            selectedBike.pricePerDay
          );
          setCalculatedPrice(price);
        } catch (error) {
          console.error("Failed to calculate price:", error);
          toast({
            title: "Error",
            description: "Failed to calculate price. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsCalculatingPrice(false);
        }
      } else {
        setCalculatedPrice(null);
      }
    };

    fetchPrice();
  }, [fromDate, toDate, selectedBike]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const sendRequest = async(event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  
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
        // Update bike's myBooking flag
        setBikes(prev => prev.map(bike => 
          bike.id === selectedBike.id 
            ? { ...bike, myBooking: true }
            : bike
        ));
        
        // Show success message
        toast({
          title: "Request Sent Successfully",
          description: "Your rental request has been submitted. The owner will respond shortly.",
        });
        
        // Reset form and close modal
        setFromDate(undefined);
        setToDate(undefined);
        setCalculatedPrice(null);
        setIsCalculatingPrice(false);
        setShowBookingDialog(false);
        setSelectedBike(null);
        setPopupPosition(null);
      } catch (error) {
        toast({
          title: "Request Failed",
          description: "Failed to submit rental request. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSendingRequest(false);
      }
    
  }

  const handleMarkerClick = useCallback(async (bike: Bike) => {
    // Show popover immediately with current bike data
    setSelectedBike(bike);
    setIsLoadingDetails(true);
    
    try {
      // Fetch detailed bike data in the background
      const bikeDetails = await getBikeDetails(bike.id);
      setSelectedBike(normalizeBike(bikeDetails));
    } catch (error) {
      console.error("Failed to fetch bike details:", error);
      // Keep showing the basic bike info even if details fail to load
    } finally {
      setIsLoadingDetails(false);
    }
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

      // const zoomListener = map.addListener("zoom_changed", updatePopupPosition);
      // const centerListener = map.addListener("center_changed", updatePopupPosition);

      // return () => {
      //   google.maps.event.removeListener(zoomListener);
      //   google.maps.event.removeListener(centerListener);
      // };
    }
  }, [map, selectedBike]);

  const handleCenterOnUser = () => {
    if (navigator.geolocation) {
      setIsMyLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCenter(newCenter);
          setUserLocation(newCenter);
 
          if (map) {
            map.panTo(newCenter);
            map.setZoom(15);
          }
 
          getAddressFromCoordinates(newCenter.lat, newCenter.lng)
            .catch((error) => {
              console.error("Error getting address:", error);
              toast({
                title: "Address Lookup Failed",
                description: "We couldn't determine your address.",
                variant: "destructive",
              });
            })
            .finally(() => {
              setIsMyLoadingLocation(false);
            });
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsMyLoadingLocation(false);
          toast({
            title: "Location Error",
            description: "Unable to get your location. Please check your permissions.",
            variant: "destructive",
          });
        },
      );
    } else {
      toast({
        title: "Not Supported",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
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
          gestureHandling: 'greedy', // Enable single-finger drag
        }}
      >
        {userLocation && (
          <Marker
            position={userLocation}
            icon={{
              url:
                "data:image/svg+xml;charset=UTF-8," +
                encodeURIComponent(`
                  <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="18" cy="18" r="12" fill="#2563eb" fill-opacity="0.25" />
                    <circle cx="18" cy="18" r="6" fill="#2563eb" stroke="white" stroke-width="2" />
                  </svg>
                `),
              scaledSize: new google.maps.Size(36, 36),
              anchor: new google.maps.Point(18, 18),
            }}
            zIndex={1500}
          />
        )}
        {bikes.map((bike) => {
          const isSelected = selectedBike?.id === bike.id;
          const isMyBooking = bike.myBooking === true;
          const markerColor = isMyBooking ? "#3b82f6" : "#14b8a6";
          
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
                    ${isSelected ? `<circle cx="28" cy="28" r="26" fill="${markerColor}" opacity="0.3"><animate attributeName="r" values="26;30;26" dur="1.5s" repeatCount="indefinite"/></circle>` : ""}
                    <circle cx="28" cy="28" r="22" fill="${markerColor}" stroke="white" stroke-width="${isSelected ? 3 : 2}"/>
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

      {/* Floating controls - Remove duplicate location button */}
      {/* <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Button size="icon" onClick={handleCenterOnUser} className="bg-card shadow-lg hover:bg-card/90">
          <Navigation className="h-5 w-5" />
        </Button>
      </div> */}

      {/* Get My Location Button */}
      <div className="absolute top-20 left-4 z-10 space-y-2">
        {currentAddress && (
          <Card className="shadow-lg">
            <div className="p-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-medium line-clamp-1">{currentAddress}</span>
            </div>
          </Card>
        )}
        <Button 
          onClick={handleCenterOnUser}
          className="shadow-lg w-full justify-start gap-2 h-auto p-3"
          disabled={isMyLoadingLocation}
        >
          {isMyLoadingLocation ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm font-medium">Getting location...</span>
            </>
          ) : (
            <>
              <Navigation className="h-5 w-5" />
              <span className="text-sm font-medium">Get My Location</span>
            </>
          )}
        </Button>
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
                {selectedBike?.images && selectedBike?.images.length > 0 && (
                  <Carousel className="w-full mb-1 sm:mb-1.5">
                    <CarouselContent>
                      {selectedBike?.images.map((image: any, index) => (
                        <CarouselItem key={index}>
                          <div className="aspect-video rounded overflow-hidden">
                            <img
                              src={image?.url}
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
                    <h3 
                      className="font-semibold text-[11px] sm:text-xs leading-tight flex-1 cursor-pointer hover:text-primary transition-colors underline decoration-dotted underline-offset-2"
                      onClick={() => navigate(`/bike/${selectedBike.id}`, { state: { bike: selectedBike } })}
                      >
                      {selectedBike.name}
                    </h3>
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
                <div className="mb-1.5 sm:mb-2 pb-1.5 sm:pb-2 border-b">
                  <p className="text-sm sm:text-base font-bold text-primary leading-none">EUR{selectedBike?.pricePerDay}</p>
                  <p className="text-[7px] sm:text-[8px] text-muted-foreground">per day</p>
                </div>

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
                      <span className="text-muted-foreground">Price per Day:</span>
                      <span className="font-medium">EUR {selectedBike?.pricePerDay}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">
                        {Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))} days
                      </span>
                    </div>
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
              onClick={(event: any) => sendRequest(event)}
              disabled={!fromDate || !toDate || isSendingRequest}
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

export default MapView;
