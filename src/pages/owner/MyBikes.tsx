import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bike, Plus, Edit, Trash2, Power, MapPin } from 'lucide-react';
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

interface BikeData {
  id: string;
  name: string;
  category: string;
  pricePerHour: number;
  pricePerDay: number;
  location: string;
  description: string;
  available: boolean;
  image?: string;
}

// Mock data
const mockBikes: BikeData[] = [
  {
    id: '1',
    name: 'Mountain Explorer Pro',
    category: 'Mountain',
    pricePerHour: 8,
    pricePerDay: 50,
    location: 'Downtown Station',
    description: 'Perfect for mountain trails and rough terrain',
    available: true,
  },
  {
    id: '2',
    name: 'City Cruiser Deluxe',
    category: 'City',
    pricePerHour: 5,
    pricePerDay: 30,
    location: 'Central Park',
    description: 'Comfortable city bike for urban riding',
    available: true,
  },
  {
    id: '3',
    name: 'Road Racer Speed',
    category: 'Road',
    pricePerHour: 10,
    pricePerDay: 60,
    location: 'North Terminal',
    description: 'High-performance road bike',
    available: false,
  },
];

const MyBikes = () => {
  const [bikes, setBikes] = useState<BikeData[]>(mockBikes);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'City',
    pricePerHour: '',
    pricePerDay: '',
    location: '',
    description: '',
  });

  const handleAddBike = () => {
    // TODO: API call to add bike
    const newBike: BikeData = {
      id: Date.now().toString(),
      name: formData.name,
      category: formData.category,
      pricePerHour: Number(formData.pricePerHour),
      pricePerDay: Number(formData.pricePerDay),
      location: formData.location,
      description: formData.description,
      available: true,
    };

    setBikes([...bikes, newBike]);
    setIsAddDialogOpen(false);
    setFormData({
      name: '',
      category: 'City',
      pricePerHour: '',
      pricePerDay: '',
      location: '',
      description: '',
    });
    toast.success('Bike added successfully!');
  };

  const handleToggleAvailability = (bikeId: string) => {
    setBikes(
      bikes.map((bike) =>
        bike.id === bikeId ? { ...bike, available: !bike.available } : bike
      )
    );
    toast.success('Bike availability updated');
  };

  const handleDeleteBike = (bikeId: string) => {
    setBikes(bikes.filter((bike) => bike.id !== bikeId));
    toast.success('Bike deleted successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Bikes</h1>
          <p className="text-muted-foreground">Manage your bike listings</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90 gap-2">
              <Plus className="h-4 w-4" />
              Add Bike
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Bike</DialogTitle>
              <DialogDescription>
                Fill in the details to list a new bike
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
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Downtown Station"
                />
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
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddBike}
                className="bg-gradient-primary hover:opacity-90"
                disabled={!formData.name || !formData.pricePerHour}
              >
                Add Bike
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
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{bike.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    {bike.location}
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
                <Button variant="outline" size="sm">
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
            <Button onClick={() => setIsAddDialogOpen(true)} className="bg-gradient-primary hover:opacity-90">
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
