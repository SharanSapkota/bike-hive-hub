import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bike, Plus, Edit, Trash2, Power, MapPin, Upload, X, Locate, ImageIcon, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { api } from '@/lib/api';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import { useAuth } from '@/contexts/AuthContext';
import { sonnerToast } from '@/components/ui/sonnertoast';

const mapContainerStyle = {
  width: '100%',
  height: '300px',
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060,
};

const MAX_IMAGES = 5;

interface BikeAddress {
  formatted: string;
  lat: number;
  lng: number;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  village?: string | null;
  street?: string | null;
  apartment?: string | null;
}

interface BikeData {
  id: number;
  name: string;
  category: string;
  pricePerHour: number;
  pricePerDay: number;
  location: string;
  address?: BikeAddress;
  description: string;
  available: boolean;
  autoAccept: boolean;
  images?: string[];
  rawImages?: string[];
  ownerId: number | null;
}

const MyBikes = () => {
  const { isLoaded } = useGoogleMaps();
  const { user } = useAuth();

  const [bikes, setBikes] = useState<BikeData[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBike, setEditingBike] = useState<BikeData | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [existingImagePreviews, setExistingImagePreviews] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [addressPredictions, setAddressPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isAddressSearching, setIsAddressSearching] = useState(false);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'City',
    pricePerHour: '',
    pricePerDay: '',
    location: '',
    address: null as BikeAddress | null,
    description: '',
    autoAccept: false,
  });

  const extractAddressParts = useCallback((result: google.maps.GeocoderResult) => {
    const components = result.address_components ?? [];
    const find = (type: string) =>
      components.find((component) => component.types.includes(type))?.long_name ?? null;

    const streetNumber = find('street_number');
    const route = find('route');
    const formattedStreet = [streetNumber, route].filter(Boolean).join(' ');

    return {
      city: find('locality') ?? find('administrative_area_level_3'),
      state: find('administrative_area_level_1'),
      country: find('country'),
      postalCode: find('postal_code'),
      village: find('sublocality_level_1') ?? find('administrative_area_level_2'),
      street: formattedStreet || find('route'),
      apartment: find('subpremise'),
    };
  }, []);

  const revokeNewImagePreviews = () => {
    newImagePreviews.forEach((preview) => {
      if (preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    });
  };

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined' || !window.google) {
      return;
    }

    if (!autocompleteServiceRef.current) {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
    }

    if (!geocoderRef.current) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }
  }, [isLoaded]);

  useEffect(() => {
    if (formData.address && !mapCenter) {
      setMapCenter({
        lat: formData.address.lat,
        lng: formData.address.lng,
      });
    }
  }, [formData.address, mapCenter]);

  useEffect(() => {
    if (mapCenter && mapRef.current) {
      mapRef.current.panTo(mapCenter);
    }
  }, [mapCenter]);

  const handleAddressInputChange = useCallback((value: string) => {
    setFormData((prev) => ({
      ...prev,
      location: value,
      address: value.trim().length === 0 ? null : prev.address && value === prev.location ? prev.address : null,
    }));

    if (
      !autocompleteServiceRef.current ||
      typeof window === 'undefined' ||
      !window.google ||
      value.trim().length < 3
    ) {
      setAddressPredictions([]);
      setIsAddressSearching(false);
      return;
    }

    setIsAddressSearching(true);
    autocompleteServiceRef.current.getPlacePredictions(
      { input: value },
      (predictions, status) => {
        setIsAddressSearching(false);
        if (
          status !== window.google.maps.places.PlacesServiceStatus.OK ||
          !predictions
        ) {
          setAddressPredictions([]);
          return;
        }
        setAddressPredictions(predictions);
      },
    );
  }, []);

  const handleSelectPrediction = useCallback(
    (prediction: google.maps.places.AutocompletePrediction) => {
      if (!geocoderRef.current) {
        return;
      }

      geocoderRef.current.geocode(
        { placeId: prediction.place_id },
        (results, status) => {
          if (status !== 'OK' || !results || !results[0]) {
            return;
          }

          const location = results[0].geometry?.location;
          if (!location) {
            return;
          }

          const lat = location.lat();
          const lng = location.lng();
          const formattedAddress =
            results[0].formatted_address ?? prediction.description;

          const parts = extractAddressParts(results[0]);

          setFormData((prev) => ({
            ...prev,
            location: formattedAddress,
            address: {
              formatted: formattedAddress,
              lat,
              lng,
              city: parts.city ?? null,
              state: parts.state ?? null,
              country: parts.country ?? null,
              postalCode: parts.postalCode ?? null,
              village: parts.village ?? null,
              street: parts.street ?? null,
              apartment: parts.apartment ?? null,
            },
          }));

          setAddressPredictions([]);
          setIsAddressSearching(false);
          setMapCenter({ lat, lng });

          setTimeout(() => {
            mapRef.current?.panTo({ lat, lng });
            mapRef.current?.setZoom(15);
          }, 0);
        },
      );
    },
    [extractAddressParts],
  );

  const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    const lat = event.latLng?.lat();
    const lng = event.latLng?.lng();

    if (lat == null || lng == null) {
      return;
    }

    const updateFormData = (formattedAddress: string, result?: google.maps.GeocoderResult) => {
      const parts = result ? extractAddressParts(result) : undefined;

      setFormData((prev) => ({
        ...prev,
        location: formattedAddress,
        address: {
          formatted: formattedAddress,
          lat,
          lng,
          city: parts?.city ?? null,
          state: parts?.state ?? null,
          country: parts?.country ?? null,
          postalCode: parts?.postalCode ?? null,
          village: parts?.village ?? null,
          street: parts?.street ?? null,
          apartment: parts?.apartment ?? null,
        },
      }));
      setAddressPredictions([]);
      setIsAddressSearching(false);
      setMapCenter({ lat, lng });
    };

    if (!geocoderRef.current) {
      updateFormData(`Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`);
      return;
    }

    geocoderRef.current.geocode(
      { location: { lat, lng } },
      (results, status) => {
        if (status === 'OK' && results && results[0]) {
          updateFormData(results[0].formatted_address ?? results[0].place_id ?? '', results[0]);
        } else {
          updateFormData(`Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`);
        }
      },
    );
  }, [extractAddressParts]);

  useEffect(() => {
    if (formData.address && mapRef.current) {
      mapRef.current.panTo({
        lat: formData.address.lat,
        lng: formData.address.lng,
      });
    }
  }, [formData.address]);

  const mediaBaseUrl = useMemo(() => {
    const base = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_BASE_URL || 'https://gear-quest.onrender.com';
    return base.replace(/\/$/, '');
  }, []);

  const combinedImagePreviews = [...existingImagePreviews, ...newImagePreviews];

  const mapBikeResponse = (bike: any): BikeData => {
    const rawAddress = Array.isArray(bike.bikeAddress)
      ? bike.bikeAddress[0]
      : bike.bikeAddress ?? bike.location ?? null;

    const normalizedAddress: BikeAddress | undefined = rawAddress
      ? {
          formatted: rawAddress.address ?? rawAddress.formatted ?? 'Not specified',
          lat: rawAddress.lat ?? rawAddress.latitude ?? 0,
          lng: rawAddress.lng ?? rawAddress.longitude ?? 0,
          city: rawAddress.city ?? null,
          state: rawAddress.state ?? null,
          country: rawAddress.country ?? null,
          postalCode: rawAddress.postalCode ?? null,
          village: rawAddress.village ?? null,
          street: rawAddress.street ?? null,
          apartment: rawAddress.apartment ?? null,
        }
      : undefined;

    const imagesSource = Array.isArray(bike.images)
      ? bike.images
      : Array.isArray(bike.bikeImages)
      ? bike.bikeImages
      : [];

    return {
      id: bike.id,
      name: bike.name,
      category: bike.category?.name || bike.category || 'General',
      pricePerHour: typeof bike.pricePerHour === 'number' ? bike.pricePerHour : bike.rentAmount || 0,
      pricePerDay: typeof bike.pricePerDay === 'number' ? bike.pricePerDay : bike.rentAmount || 0,
      location: normalizedAddress?.formatted || 'Not specified',
      address: normalizedAddress,
      description: bike.description || '',
      available: (bike.status ?? '').toString().toUpperCase() === 'AVAILABLE',
      autoAccept: Boolean(bike.autoAccept),
      images: imagesSource
        .map((img: any) => img?.url ?? img?.imageUrl ?? '')
        .filter((url: string) => !!url)
        .map((url: string) => (url.startsWith('http') ? url : `${mediaBaseUrl}${url}`)),
      rawImages: imagesSource
        .map((img: any) => img?.url ?? img?.imageUrl ?? '')
        .filter((url: string) => !!url),
      ownerId: bike.ownerId ?? bike.owner?.id ?? null,
    };
  };

  const loadBikes = useCallback(async () => {
    if (!user) {
      setBikes([]);
      return;
    }

    try {
      const response = await api.get('/bikes', {
        params: { ownerId: user.id },
      });
      const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
      const mapped = data
        .map(mapBikeResponse)
        .filter((bike) => bike.ownerId === user.id);
      setBikes(mapped);
    } catch (error) {
      console.error('Failed to load bikes', error);
      sonnerToast('Unable to load bikes', 'Unable to load bikes. Please try again later.');
    }
  }, [user]);

  useEffect(() => {
    loadBikes();
  }, [loadBikes]);

  const resolvedCenter =
    mapCenter ??
    (formData.address
      ? { lat: formData.address.lat, lng: formData.address.lng }
      : defaultCenter);

  const resolvedZoom = mapCenter || formData.address ? 15 : 12;

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'City',
      pricePerHour: '',
      pricePerDay: '',
      location: '',
      address: null,
      description: '',
      autoAccept: false,
    });
    setExistingImages([]);
    setExistingImagePreviews([]);
    revokeNewImagePreviews();
    setNewImages([]);
    setNewImagePreviews([]);
    setAddressPredictions([]);
    setIsAddressSearching(false);
    setMapCenter(null);
    setEditingBike(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
    // Automatically get current location for new bike
    setIsMapLoading(true);
    setTimeout(() => {
      handleUseCurrentLocation();
    }, 500);
  };

  const openEditDialog = (bike: BikeData) => {
    setEditingBike(bike);
    setFormData({
      name: bike.name,
      category: bike.category,
      pricePerHour: bike.pricePerHour.toString(),
      pricePerDay: bike.pricePerDay.toString(),
      location: bike.location,
      address: bike.address || null,
      description: bike.description,
      autoAccept: bike.autoAccept,
    });
    setAddressPredictions([]);
    setIsAddressSearching(false);
    setMapCenter(bike.address ? { lat: bike.address.lat, lng: bike.address.lng } : null);
    // Set existing images
    setExistingImagePreviews(bike.images || []);
    setExistingImages(bike.rawImages || []);
    revokeNewImagePreviews();
    setNewImages([]);
    setNewImagePreviews([]);
    // Show map loading while setting up the previous location
    setIsMapLoading(true);
    setIsDialogOpen(true);
    // Map will load with existing coordinates
    setTimeout(() => {
      setIsMapLoading(false);
    }, 1000);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (existingImagePreviews.length + newImagePreviews.length + files.length > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    setNewImages((prev) => [...prev, ...files]);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setNewImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (index: number) => {
    if (index < existingImagePreviews.length) {
      setExistingImagePreviews((prev) => prev.filter((_, i) => i !== index));
      setExistingImages((prev) => prev.filter((_, i) => i !== index));
    } else {
      const localIndex = index - existingImagePreviews.length;
      const previewToRemove = newImagePreviews[localIndex];
      if (previewToRemove?.startsWith('blob:')) {
        URL.revokeObjectURL(previewToRemove);
      }
      setNewImagePreviews((prev) => prev.filter((_, i) => i !== localIndex));
      setNewImages((prev) => prev.filter((_, i) => i !== localIndex));
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      setIsMapLoading(false);
      return;
    }

    setIsMapLoading(true);
    toast.loading('Getting your location...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        if (window.google) {
          const geocoder = new window.google.maps.Geocoder();
          const latlng = { lat: latitude, lng: longitude };

          setMapCenter({ lat: latitude, lng: longitude });
          const fallbackFormatted = `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`;
          setFormData((prev) => ({
            ...prev,
            location: fallbackFormatted,
            address: {
              formatted: fallbackFormatted,
              lat: latitude,
              lng: longitude,
              city: null,
              state: null,
              country: null,
              postalCode: null,
              village: null,
              street: null,
              apartment: null,
            },
          }));
          setAddressPredictions([]);
          setIsAddressSearching(false);

          geocoder.geocode({ location: latlng }, (results, status) => {
            toast.dismiss();
            setIsMapLoading(false);
            
            if (status === 'OK' && results && results[0]) {
              const formattedAddress = results[0].formatted_address;
              const parts = extractAddressParts(results[0]);
             
              setFormData((prev) => ({
                ...prev,
                location: formattedAddress,
                address: {
                  formatted: formattedAddress,
                  lat: latitude,
                  lng: longitude,
                  city: parts.city ?? null,
                  state: parts.state ?? null,
                  country: parts.country ?? null,
                  postalCode: parts.postalCode ?? null,
                  village: parts.village ?? null,
                  street: parts.street ?? null,
                  apartment: parts.apartment ?? null,
                },
              }));
              mapRef.current?.panTo({ lat: latitude, lng: longitude });
              mapRef.current?.setZoom(15);
              sonnerToast('Location updated!', 'You have successfully updated the location.');
            } else {
              sonnerToast('Could not retrieve address', 'Could not retrieve the address.');
            }
          });
        } else {
          setIsMapLoading(false);
        }
      },
      (error) => {
        toast.dismiss();
        setIsMapLoading(false);
        toast.error('Unable to get your location');
        console.error('Geolocation error:', error);
      }
    );
  };

  const handleSaveBike = async () => {
    let loadingId: string | number | undefined;
    try {
      if (!formData.name.trim()) {
        toast.error('Bike name is required');
        return;
      }

      if (!formData.address) {
        toast.error('Please choose a location for the bike');
        return;
      }

      loadingId = toast.loading(editingBike ? 'Updating bike...' : 'Adding bike...');

      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('category', formData.category);
      // payload.append('pricePerHour', formData.pricePerHour);
      if (formData.pricePerDay) {
        payload.append('pricePerDay', formData.pricePerDay);
      }
      payload.append('location', formData.location);
      payload.append('description', formData.description);
      payload.append('rentAmount', formData.pricePerDay);
      payload.append('autoAccept', formData.autoAccept ? 'true' : 'false');
      payload.append('latitude', String(formData.address.lat));
      payload.append('longitude', String(formData.address.lng));
      payload.append(
        'address',
        JSON.stringify({
          formatted: formData.address.formatted || formData.location,
          lat: formData.address.lat,
          lng: formData.address.lng,
          city: formData.address.city || '',
          state: formData.address.state,
          country: formData.address.country,
          postalCode: formData.address.postalCode,
          village: formData.address.village,
          street: formData.address.street,
          apartment: formData.address.apartment,
        })
      );

      payload.append('existingImages', JSON.stringify(existingImages));
      payload.append('status', editingBike && !editingBike?.available ? 'MAINTENANCE' : 'AVAILABLE');
      payload.append('categoryName', formData.category);

      newImages.forEach((file) => {
        payload.append('images', file);
      });

      if (editingBike) {
        await api.put(`/bikes/${editingBike.id}`, payload, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        await loadBikes();
        sonnerToast('Bike updated successfully!', 'You have successfully updated the bike.');
      } else {
        const response = await api.post('/bikes', payload, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const created = mapBikeResponse(response.data.data);
        if (user && created?.ownerId === Number(user?.id)) {
          setBikes((prev) => [...prev, created]);
        }
        sonnerToast('Gear added successfully!', 'You have successfully added the gear.');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving gear:', error);
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        (editingBike ? 'Failed to update gear' : 'Failed to add gear');
      toast.error(message);
    } finally {
      if (loadingId !== undefined) {
        toast.dismiss(loadingId);
      }
    }
  };

  const handleToggleAvailability = (bikeId: number) => {
    setBikes(
      bikes.map((bike) =>
        bike.id === bikeId ? { ...bike, available: !bike.available } : bike
      )
    );
    sonnerToast('Gear availability updated', 'You have successfully updated the gear availability.');
  };

  const handleDeleteBike = async (bikeId: number) => {
    const loadingId = toast.loading('Deleting bike...');
    try {
      await api.delete(`/bikes/${bikeId}`);
      setBikes((prev) => prev.filter((bike) => bike.id !== bikeId));
      sonnerToast('Gear deleted successfully', 'You have successfully deleted the gear.');
    } catch (error: any) {
      console.error('Failed to delete gear:', error);
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Failed to delete gear';
      sonnerToast('Failed to delete gear', 'Failed to delete the gear.');
    } finally {
      toast.dismiss(loadingId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Gears</h1>
          <p className="text-muted-foreground">Manage your gear listings</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90 gap-2" onClick={openAddDialog}>
              <Plus className="h-4 w-4" />
              Add Gear
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBike ? 'Edit Gear' : 'Add New Gear'}</DialogTitle>
              <DialogDescription>
                {editingBike ? 'Update the bike details' : 'Fill in the details to list a new bike'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Gear Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Mountain Explorer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mountain">Mountain</SelectItem>
                    <SelectItem value="City">City</SelectItem>
                    <SelectItem value="Road">Road</SelectItem>
                    <SelectItem value="Electric">Electric</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Commented out: Price per hour input */}
              {/* <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pricePerHour">Price/Hour ($)</Label>
                  <Input
                    id="pricePerHour"
                    type="number"
                    value={formData.pricePerHour}
                    onChange={(e) => setFormData({ ...formData, pricePerHour: e.target.value })}
                    placeholder="8"
                  />
                </div> */}
                <div className="space-y-2">
                  <Label htmlFor="pricePerDay">Price/Day (EUR)</Label>
                  <Input
                    id="pricePerDay"
                    type="number"
                    value={formData.pricePerDay}
                    onChange={(e) => setFormData({ ...formData, pricePerDay: e.target.value })}
                    placeholder="50"
                  />
                </div>
              {/* </div> */}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="address">Address</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleUseCurrentLocation}
                    className="h-auto py-1 px-2 text-xs"
                    disabled={!isLoaded}
                  >
                    <Locate className="h-3 w-3 mr-1" />
                    Use current location
                  </Button>
                </div>
                {isLoaded ? (
                  <>
                    <div className="relative">
                      <Input
                        id="address"
                        value={formData.location}
                        onChange={(e) => handleAddressInputChange(e.target.value)}
                        placeholder="Search for an address..."
                        className="w-full pr-10"
                      />
                      {isAddressSearching && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    {addressPredictions.length > 0 && (
                      <div className="mt-2 border rounded-lg bg-background shadow-sm overflow-hidden">
                        {addressPredictions.map((prediction) => (
                          <button
                            type="button"
                            key={prediction.place_id}
                            onClick={() => handleSelectPrediction(prediction)}
                            className="w-full text-left px-3 py-2 hover:bg-accent focus-visible:bg-accent focus:outline-none transition-colors"
                          >
                            <div className="text-sm font-medium text-foreground">
                              {prediction.structured_formatting?.main_text ?? prediction.description}
                            </div>
                            {prediction.structured_formatting?.secondary_text && (
                              <div className="text-xs text-muted-foreground">
                                {prediction.structured_formatting.secondary_text}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Input
                    id="address"
                    value={formData.location}
                    onChange={(e) => handleAddressInputChange(e.target.value)}
                    placeholder="Loading search..."
                    disabled
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  Start typing to search for an address, then select a result to drop the marker or click directly on the map.
                </p>
                
                {isLoaded && (
                  <div className="mt-3 rounded-lg overflow-hidden border relative">
                    {isMapLoading && (
                      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          <p className="text-sm text-muted-foreground">Loading map...</p>
                        </div>
                      </div>
                    )}
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={resolvedCenter}
                      zoom={resolvedZoom}
                      onLoad={(map) => {
                        mapRef.current = map;
                        if (resolvedCenter) {
                          map.panTo(resolvedCenter);
                        }
                      }}
                      onUnmount={() => {
                        mapRef.current = null;
                      }}
                      onClick={handleMapClick}
                    >
                      {formData.address && (
                        <Marker
                          position={{ lat: formData.address.lat, lng: formData.address.lng }}
                        />
                      )}
                    </GoogleMap>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Gear Images (Max {MAX_IMAGES})</Label>
                <div className="space-y-3">
                  {combinedImagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      {combinedImagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {combinedImagePreviews.length < MAX_IMAGES && (
                    <label
                      htmlFor="image-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG or WEBP (max {MAX_IMAGES} images)
                        </p>
                      </div>
                      <input
                        id="image-upload"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={handleImageSelect}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your gear..."
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="autoAccept" className="text-base cursor-pointer">
                    Auto Accept Requests
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically approve rental requests for this bike
                  </p>
                </div>
                <Switch
                  id="autoAccept"
                  checked={formData.autoAccept}
                  onCheckedChange={(checked) => setFormData({ ...formData, autoAccept: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsDialogOpen(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveBike}
                className="bg-gradient-primary hover:opacity-90"
                disabled={!formData.name}
              >
                {editingBike ? 'Update Gear' : 'Add Gear'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Gears
            </CardTitle>
            <Bike className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{bikes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available
            </CardTitle>
            <Power className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {bikes.filter((b) => b?.available)?.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rented Out
            </CardTitle>
            <MapPin className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {bikes.filter((b) => !b.available).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bikes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bikes.map((bike) => (
          <Card key={bike.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="space-y-4">
              {bike.images && bike.images.length > 0 ? (
                <div className="relative w-full h-40 overflow-hidden rounded-lg border bg-muted">
                  <img
                    src={bike.images[0]}
                    alt={bike.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {bike.images.length > 1 && (
                    <Badge className="absolute top-3 right-3 bg-background/80 backdrop-blur border">
                      +{bike.images.length - 1} more
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="flex h-40 w-full items-center justify-center rounded-lg border border-dashed bg-muted/40 text-muted-foreground">
                  <ImageIcon className="h-8 w-8" />
                </div>
              )}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{bike.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    {bike.location || 'Not specified'}
                  </CardDescription>
                </div>
                <Badge
                  variant={bike.available ? 'default' : 'secondary'}
                  className={bike.available ? 'bg-green-500' : ''}
                >
                  {bike.available ? 'Available' : 'Rented'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex gap-2">
                  <Badge variant="outline">{bike.category}</Badge>
                  {bike.autoAccept && (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-700 border-green-500/20">
                      Auto Accept
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">{bike.description}</p>
              </div>

              {/* <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-semibold text-primary">${bike.pricePerHour}/hr</p>
                  <p className="text-muted-foreground">${bike.pricePerDay}/day</p>
                </div>
              </div> */}

              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleToggleAvailability(bike.id)}
                >
                  <Power className="h-4 w-4 mr-1" />
                  {bike.available ? 'Disable' : 'Enable'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => openEditDialog(bike)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteBike(bike.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {bikes.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Bike className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No gears yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by adding your first bike to the platform
            </p>
            <Button onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }} className="bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Gear
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default MyBikes;
