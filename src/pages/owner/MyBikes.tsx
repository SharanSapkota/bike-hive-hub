import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bike, Plus, Edit, Trash2, Power, MapPin, Upload, X, Locate, ImageIcon } from 'lucide-react';
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
import { toast } from 'sonner';
import { Autocomplete, GoogleMap, Marker } from '@react-google-maps/api';
import { api } from '@/lib/api';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import { useAuth } from '@/contexts/AuthContext';

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
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const revokeNewImagePreviews = () => {
    newImagePreviews.forEach((preview) => {
      if (preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    });
  };

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'City',
    pricePerHour: '',
    pricePerDay: '',
    location: '',
    address: null as { formatted: string; lat: number; lng: number } | null,
    description: '',
  });

  const mediaBaseUrl = useMemo(() => {
    const base = import.meta.env.VITE_BASE_API_URL || 'http://localhost:4000/api';
    return base.replace(/\/api\/?$/, '');
  }, []);

  const combinedImagePreviews = [...existingImagePreviews, ...newImagePreviews];

  const mapBikeResponse = (bike: any): BikeData => {
    const addressSource = Array.isArray(bike.bikeAddress) ? bike.bikeAddress[0] : bike.bikeAddress;
    const imagesSource = Array.isArray(bike.bikeImages) ? bike.bikeImages : [];
    return {
      id: bike.id,
      name: bike.name,
      category: bike.category?.name || 'General',
      pricePerHour: typeof bike.pricePerHour === 'number' ? bike.pricePerHour : bike.rentAmount || 0,
      pricePerDay: typeof bike.pricePerDay === 'number' ? bike.pricePerDay : 0,
      location: addressSource?.address || 'Not specified',
      address: addressSource
        ? {
            formatted: addressSource.address,
            lat: addressSource.latitude,
            lng: addressSource.longitude,
            city: addressSource.city,
            state: addressSource.state,
            country: addressSource.country,
            postalCode: addressSource.postalCode,
          }
        : undefined,
      description: bike.description || '',
      available: bike.status ? bike.status === 'AVAILABLE' : true,
      images: imagesSource.map((img: any) => {
        if (!img?.imageUrl) return '';
        return img.imageUrl.startsWith('http') ? img.imageUrl : `${mediaBaseUrl}${img.imageUrl}`;
      }),
      rawImages: imagesSource.map((img: any) => img.imageUrl),
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
      toast.error('Unable to load bikes. Please try again later.');
    }
  }, [user]);

  useEffect(() => {
    loadBikes();
  }, [loadBikes]);

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'City',
      pricePerHour: '',
      pricePerDay: '',
      location: '',
      address: null,
      description: '',
    });
    setExistingImages([]);
    setExistingImagePreviews([]);
    revokeNewImagePreviews();
    setNewImages([]);
    setNewImagePreviews([]);
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
    });
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

  const onPlaceSelected = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry?.location) {
        setFormData({
          ...formData,
          location: place.formatted_address || '',
          address: {
            formatted: place.formatted_address || '',
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          },
        });
      }
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

          geocoder.geocode({ location: latlng }, (results, status) => {
            toast.dismiss();
            setIsMapLoading(false);
            
            if (status === 'OK' && results && results[0]) {
              setFormData({
                ...formData,
                location: results[0].formatted_address,
                address: {
                  formatted: results[0].formatted_address,
                  lat: latitude,
                  lng: longitude,
                },
              });
              toast.success('Location updated!');
            } else {
              toast.error('Could not retrieve address');
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

      if (!formData.pricePerHour) {
        toast.error('Please provide an hourly price');
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
      payload.append('pricePerHour', formData.pricePerHour);
      if (formData.pricePerDay) {
        payload.append('pricePerDay', formData.pricePerDay);
      }
      payload.append('location', formData.location);
      payload.append('description', formData.description);
      payload.append('rentAmount', formData.pricePerHour);
      payload.append('latitude', String(formData.address.lat));
      payload.append('longitude', String(formData.address.lng));
      payload.append(
        'address',
        JSON.stringify({
          formatted: formData.address.formatted || formData.location,
          lat: formData.address.lat,
          lng: formData.address.lng,
        })
      );

      payload.append('existingImages', JSON.stringify(existingImages));
      payload.append('status', editingBike && !editingBike.available ? 'MAINTENANCE' : 'AVAILABLE');
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
        toast.success('Bike updated successfully!');
      } else {
        const response = await api.post('/bikes', payload, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const created = mapBikeResponse(response.data);
        if (user && created?.ownerId === Number(user?.id)) {
          setBikes((prev) => [...prev, created]);
        }
        toast.success('Bike added successfully!');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving bike:', error);
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        (editingBike ? 'Failed to update bike' : 'Failed to add bike');
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
    toast.success('Bike availability updated');
  };

  const handleDeleteBike = async (bikeId: number) => {
    const loadingId = toast.loading('Deleting bike...');
    try {
      await api.delete(`/bikes/${bikeId}`);
      setBikes((prev) => prev.filter((bike) => bike.id !== bikeId));
      toast.success('Bike deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete bike:', error);
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Failed to delete bike';
      toast.error(message);
    } finally {
      toast.dismiss(loadingId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Bikes</h1>
          <p className="text-muted-foreground">Manage your bike listings</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90 gap-2" onClick={openAddDialog}>
              <Plus className="h-4 w-4" />
              Add Bike
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBike ? 'Edit Bike' : 'Add New Bike'}</DialogTitle>
              <DialogDescription>
                {editingBike ? 'Update the bike details' : 'Fill in the details to list a new bike'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Bike Name</Label>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pricePerHour">Price/Hour ($)</Label>
                  <Input
                    id="pricePerHour"
                    type="number"
                    value={formData.pricePerHour}
                    onChange={(e) => setFormData({ ...formData, pricePerHour: e.target.value })}
                    placeholder="8"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pricePerDay">Price/Day ($)</Label>
                  <Input
                    id="pricePerDay"
                    type="number"
                    value={formData.pricePerDay}
                    onChange={(e) => setFormData({ ...formData, pricePerDay: e.target.value })}
                    placeholder="50"
                  />
                </div>
              </div>

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
                  <Autocomplete
                    onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
                    onPlaceChanged={onPlaceSelected}
                  >
                    <Input
                      id="address"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Search for an address..."
                      className="w-full"
                    />
                  </Autocomplete>
                ) : (
                  <Input
                    id="address"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Loading search..."
                    disabled
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  Start typing to search for an address
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
                      center={formData.address ? { lat: formData.address.lat, lng: formData.address.lng } : defaultCenter}
                      zoom={formData.address ? 15 : 12}
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
                <Label>Bike Images (Max {MAX_IMAGES})</Label>
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
                  placeholder="Describe your bike..."
                  rows={3}
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
                disabled={!formData.name || !formData.pricePerHour}
              >
                {editingBike ? 'Update Bike' : 'Add Bike'}
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
              Total Bikes
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
              {bikes.filter((b) => b.available).length}
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
                  <CardTitle className="text-lg">{bike?.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    {bike?.location}
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
                <Badge variant="outline">{bike.category}</Badge>
                <p className="text-sm text-muted-foreground mt-2">{bike.description}</p>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-semibold text-primary">${bike.pricePerHour}/hr</p>
                  <p className="text-muted-foreground">${bike.pricePerDay}/day</p>
                </div>
              </div>

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
            <h3 className="text-lg font-semibold mb-2">No bikes yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by adding your first bike to the platform
            </p>
            <Button onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }} className="bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Bike
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default MyBikes;
