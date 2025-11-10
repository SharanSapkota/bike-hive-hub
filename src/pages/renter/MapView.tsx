import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleMap, Marker, Autocomplete } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation, Star, X, Search, Loader2 } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useGoogleMaps } from "@/contexts/GoogleMapsContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Bike {
  id: number | string;
  name: string;
  location: { lat: number; lng: number; city?: string | null; state?: string | null; address?: string | null };
  pricePerHour: number;
  category: string;
  available: boolean;
  image?: string;
  images?: string[];
  condition?: string;
  reviews?: number;
  rating?: number;
  ownerId?: number | string | null;
}

const containerStyle = {
  width: "100%",
  height: "100%",
};

const MapView = () => {
  const navigate = useNavigate();
  const { isLoaded, loadError } = useGoogleMaps();
  const { user } = useAuth();

  const [bikes, setBikes] = useState<Bike[]>([]);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState({ lat: 40.7128, lng: -74.006 });
  const [selectedBike, setSelectedBike] = useState<Bike | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isLoadingBikes, setIsLoadingBikes] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string>("");
  const [searchValue, setSearchValue] = useState<string>("");
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const autoplayTimeout = useRef<NodeJS.Timeout | null>(null);
  const mediaBaseUrl = useMemo(() => {
    const base = import.meta.env.VITE_BASE_API_URL || "http://localhost:4000/api";
    return base.replace(/\/api\/?$/, "");
  }, []);

  const fetchBikes = useCallback(async () => {
    setIsLoadingBikes(true);
    try {
      const response = await api.get("/bikes", {
        params: {
          status: "AVAILABLE",
        },
      });

      const data = Array.isArray(response.data) ? response.data : response.data?.data || [];

      const mapped: Bike[] = data
        .map((bike: any) => {
          const address = Array.isArray(bike.bikeAddress) ? bike.bikeAddress[0] : bike.bikeAddress;

          if (!address || address.latitude == null || address.longitude == null) {
            return null;
          }

          const images = Array.isArray(bike.bikeImages)
            ? bike.bikeImages
                .map((img: any) => img?.imageUrl)
                .filter((img: string | undefined) => !!img)
            : [];

          const normalizedImages = images.map((img: string) =>
            img.startsWith("http") ? img : `${mediaBaseUrl}${img}`
          );

          const pricePerHour =
            typeof bike.pricePerHour === "number"
              ? bike.pricePerHour
              : typeof bike.rentAmount === "number"
              ? bike.rentAmount
              : 0;

          return {
            id: bike.id,
            name: bike.name,
            location: {
              lat: address.latitude,
              lng: address.longitude,
              city: address.city,
              state: address.state,
              address: address.address,
            },
            pricePerHour,
            category: bike.category?.name || "Unknown",
            available: bike.status === "AVAILABLE",
            images: normalizedImages,
            image: normalizedImages[0],
            ownerId: bike.owner?.id ?? bike.ownerId ?? null,
          } as Bike;
        })
        .filter((bike: Bike | null): bike is Bike => bike !== null);

      const filtered = mapped.filter((bike) => {
        if (!bike.available) return false;
        if (user?.id != null && bike.ownerId === user.id) return false;
        return true;
      });

      setBikes(filtered);

      if (filtered.length > 0) {
        setCenter({ lat: filtered[0].location.lat, lng: filtered[0].location.lng });
      }
    } catch (error) {
      console.error("Failed to load bikes", error);
      toast.error("Unable to load available bikes right now.");
    } finally {
      setIsLoadingBikes(false);
    }
  }, [user?.id]);

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

  useEffect(() => {
    // Check if we have a cached location
    const cachedLocation = sessionStorage.getItem('userLocation');
    const cachedAddress = sessionStorage.getItem('userAddress');
    
    if (cachedLocation && cachedAddress) {
      // Use cached location - no loading needed
      const location = JSON.parse(cachedLocation);
      setCenter(location);
      setCurrentAddress(cachedAddress);
      setIsLoadingLocation(false);
    }

    // Get user's current location only if not cached
    if (!cachedLocation && navigator.geolocation) {
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
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLoadingLocation(false);
        },
      );
    } else {
      setIsLoadingLocation(false);
    }

    fetchBikes();
  }, [fetchBikes]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const handleMarkerClick = useCallback((bike: Bike) => {
    setSelectedBike(bike);
    setIsLoadingDetails(true);
    // Mock timeout to simulate API call
    setTimeout(() => {
      setIsLoadingDetails(false);
    }, 1000);

    if (map) {
      map.panTo({ lat: bike.location.lat, lng: bike.location.lng });
      map.setZoom(15);
    }
  }, [map]);

  const handleBikeCardClick = useCallback(
    (bike: Bike) => {
      setSelectedBike(bike);
      if (map) {
        map.panTo({ lat: bike.location.lat, lng: bike.location.lng });
        map.setZoom(15);
      }
    },
    [map]
  );

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
              new google.maps.LatLng(selectedBike.location.lat, selectedBike.location.lng),
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
      {(isLoadingLocation || isLoadingBikes) && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-foreground font-semibold text-lg">
              {isLoadingLocation ? "Getting your location..." : "Loading available bikes..."}
            </p>
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

      {/* Available bikes carousel */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-4xl px-4">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted-foreground/30">
          {bikes.length === 0 && !isLoadingBikes ? (
            <Card className="px-4 py-3 shadow-lg bg-background/90 border-dashed border-muted-foreground/40">
              <p className="text-sm text-muted-foreground">No bikes available nearby yet.</p>
            </Card>
          ) : (
            bikes.map((bike) => {
              const isSelected = selectedBike?.id === bike.id;
              return (
                <Card
                  key={bike.id}
                  className={`min-w-[220px] max-w-[260px] shadow-lg transition-all cursor-pointer border ${
                    isSelected ? "border-primary shadow-primary/30" : "border-transparent"
                  }`}
                  onClick={() => handleBikeCardClick(bike)}
                >
                  <div className="relative h-32 w-full overflow-hidden rounded-t-lg">
                    {bike.images && bike.images.length > 0 ? (
                      <img
                        src={bike.images[0]}
                        alt={bike.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        No image
                      </div>
                    )}
                    <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px]">
                      ${bike.pricePerHour}/hr
                    </Badge>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold leading-tight line-clamp-2">{bike.name}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {bike.location.city ?? "Unknown"}, {bike.location.state ?? ""}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${isSelected ? "bg-primary/10 text-primary" : ""}`}
                      >
                        Available
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      className="bg-gradient-primary hover:opacity-90 w-full text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/payment/${bike.id}`);
                      }}
                    >
                      Rent Now
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Anchored popup emerging from marker */}
      {selectedBike && popupPosition && (
        <div
          className="fixed z-20 animate-scale-in pointer-events-none"
          style={{
            left: `${popupPosition.x}px`,
            top: `${popupPosition.y}px`,
            transform: "translate(-50%, calc(-100% - 35px))",
            maxWidth: "calc(100vw - 32px)",
          }}
        >
          {/* Arrow pointing to marker */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full">
            <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[10px] border-l-transparent border-r-transparent border-t-card"></div>
          </div>

          <Card className="w-[240px] shadow-xl pointer-events-auto max-h-[60vh] overflow-y-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedBike(null);
                setPopupPosition(null);
                setIsLoadingDetails(false);
              }}
              className="absolute top-0.5 right-0.5 h-6 w-6 rounded-full z-10 bg-background/90 hover:bg-background"
              aria-label="Close"
            >
              <X className="h-3 w-3" />
            </Button>
            
            {isLoadingDetails ? (
              <div className="p-4 flex items-center justify-center min-h-[200px]">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Loading details...</p>
                </div>
              </div>
            ) : (
              <div className="p-2">
                {/* Image Carousel */}
                {selectedBike.images && selectedBike.images.length > 0 && (
                  <Carousel className="w-full mb-2">
                    <CarouselContent>
                      {selectedBike.images.map((image, index) => (
                        <CarouselItem key={index}>
                          <div className="aspect-video rounded overflow-hidden">
                            <img
                              src={image}
                              alt={`${selectedBike.name} - ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {selectedBike.images.length > 1 && (
                      <>
                        <CarouselPrevious className="left-0.5 h-5 w-5" />
                        <CarouselNext className="right-0.5 h-5 w-5" />
                      </>
                    )}
                  </Carousel>
                )}

                <div className="mb-2">
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <h3 className="font-semibold text-sm leading-tight flex-1">{selectedBike.name}</h3>
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary text-[10px] px-1.5 py-0 shrink-0 h-4"
                    >
                      Available
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <MapPin className="h-2.5 w-2.5" />
                    {selectedBike.location.city}, {selectedBike.location.state} • {selectedBike.category}
                  </p>
                </div>

                {/* Condition and Reviews */}
                <div className="flex items-center gap-2 mb-2 text-[10px]">
                  {selectedBike.condition && <span className="text-muted-foreground">{selectedBike.condition}</span>}
                  {selectedBike.rating && selectedBike.reviews && (
                    <div className="flex items-center gap-0.5">
                      <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{selectedBike.rating}</span>
                      <span className="text-muted-foreground">({selectedBike.reviews})</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-primary leading-none">${selectedBike.pricePerHour}</p>
                    <p className="text-[9px] text-muted-foreground">per hour</p>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-gradient-primary hover:opacity-90 h-7 text-xs px-3"
                    onClick={() => navigate(`/payment/${selectedBike.id}`)}
                  >
                    Rent
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default MapView;
