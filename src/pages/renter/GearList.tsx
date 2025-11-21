import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Star, Filter } from "lucide-react";
import { getGears } from "@/services/gear";
import { normalizeBike } from "@/lib/bike";
import { Skeleton } from "@/components/ui/skeleton";

interface Gear {
  id: string;
  name: string;
  location: { lat: number; lng: number; city: string; state: string };
  pricePerDay?: number;
  pricePerHour: number;
  category: string;
  subCategory?: string;
  available: boolean;
  image?: string;
  images?: string[];
  condition?: string;
  rating?: number;
  reviews?: number;
}

const GearList = () => {
  const navigate = useNavigate();
  const [gears, setGears] = useState<Gear[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("all");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Mock categories - replace with API call
  const categories = [
    { value: "all", label: "All Categories" },
    { value: "camping", label: "Camping" },
    { value: "hiking", label: "Hiking" },
    { value: "climbing", label: "Climbing" },
    { value: "water-sports", label: "Water Sports" },
    { value: "winter-sports", label: "Winter Sports" },
  ];

  const subCategories = {
    camping: ["Tents", "Sleeping Bags", "Cooking Gear", "Backpacks"],
    hiking: ["Boots", "Trekking Poles", "GPS Devices", "Hydration Packs"],
    climbing: ["Ropes", "Harnesses", "Carabiners", "Helmets"],
    "water-sports": ["Kayaks", "Paddleboards", "Life Jackets", "Wet Suits"],
    "winter-sports": ["Skis", "Snowboards", "Boots", "Poles"],
  };

  const fetchGears = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      
      if (userLocation) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
      }
      
      if (selectedCategory !== "all") {
        params.category = selectedCategory;
      }
      
      if (selectedSubCategory !== "all") {
        params.subCategory = selectedSubCategory;
      }
      
      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await getGears(params);
      const gearList = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      const normalized = gearList.map((gear: any) => normalizeBike(gear));
      setGears(normalized);
    } catch (error) {
      console.error("Failed to fetch gears:", error);
      setGears([]);
    } finally {
      setIsLoading(false);
    }
  }, [userLocation, selectedCategory, selectedSubCategory, searchQuery]);

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  useEffect(() => {
    fetchGears();
  }, [fetchGears]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGears();
  };

  const handleGearClick = (gearId: string) => {
    navigate(`/renter/gear/${gearId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Adventure Gear Rentals</h1>
        <p className="text-muted-foreground">Find the perfect gear for your next adventure</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for adventure gear..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit">Search</Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              
              <Select value={selectedCategory} onValueChange={(value) => {
                setSelectedCategory(value);
                setSelectedSubCategory("all");
              }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedCategory !== "all" && subCategories[selectedCategory] && (
                <Select value={selectedSubCategory} onValueChange={setSelectedSubCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sub-category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sub-categories</SelectItem>
                    {subCategories[selectedCategory].map((sub) => (
                      <SelectItem key={sub} value={sub.toLowerCase()}>
                        {sub}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button variant="outline" size="sm" onClick={() => navigate("/renter/map")}>
                <MapPin className="h-4 w-4 mr-2" />
                Map View
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Gear Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-48 w-full" />
              <CardContent className="pt-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : gears.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No gear found. Try adjusting your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gears.map((gear) => (
            <Card
              key={gear.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleGearClick(gear.id)}
            >
              <div className="relative h-48 overflow-hidden rounded-t-lg">
                <img
                  src={gear.image || gear.images?.[0] || "/placeholder.svg"}
                  alt={gear.name}
                  className="w-full h-full object-cover"
                />
                {gear.available ? (
                  <Badge className="absolute top-2 right-2 bg-green-500">Available</Badge>
                ) : (
                  <Badge className="absolute top-2 right-2 bg-red-500">Unavailable</Badge>
                )}
              </div>
              <CardContent className="pt-4">
                <h3 className="font-semibold text-lg mb-2">{gear.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <MapPin className="h-4 w-4" />
                  <span>{gear.location?.city}, {gear.location?.state}</span>
                </div>
                {gear.rating && (
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{gear.rating}</span>
                    {gear.reviews && (
                      <span className="text-sm text-muted-foreground">({gear.reviews} reviews)</span>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <p className="text-sm text-muted-foreground">From</p>
                    <p className="text-lg font-bold text-primary">
                      ${gear.pricePerDay || gear.pricePerHour}/day
                    </p>
                  </div>
                  <Badge variant="secondary">{gear.category}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GearList;
