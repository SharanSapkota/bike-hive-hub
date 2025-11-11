import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, DollarSign, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

// Mock API call to complete rental
const mockCompleteRental = (rentalId: string): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 1500);
  });
};

interface RentalHistory {
  id: string;
  bikeName: string;
  location: string;
  startDate: string;
  endDate: string;
  duration: string;
  cost: number;
  status: 'completed' | 'cancelled' | 'active';
}

const History = () => {
  const { user } = useAuth();
  const [completingRental, setCompletingRental] = useState<string | null>(null);

  // Mock data - replace with actual API call
  const initialRentalHistory: RentalHistory[] = [
    {
      id: '1',
      bikeName: 'Mountain Bike Pro',
      location: 'Central Park',
      startDate: '2025-01-15',
      endDate: '2025-01-16',
      duration: '1 day',
      cost: 45,
      status: 'completed'
    },
    {
      id: '2',
      bikeName: 'City Cruiser',
      location: 'Downtown',
      startDate: '2025-01-10',
      endDate: '2025-01-10',
      duration: '4 hours',
      cost: 25,
      status: 'completed'
    },
    {
      id: '3',
      bikeName: 'Electric Bike',
      location: 'Riverside',
      startDate: '2025-01-05',
      endDate: '2025-01-07',
      duration: '2 days',
      cost: 120,
      status: 'completed'
    },
    {
      id: '4',
      bikeName: 'Road Racer',
      location: 'Uptown',
      startDate: '2025-02-01',
      endDate: '2025-02-03',
      duration: '2 days',
      cost: 80,
      status: 'active'
    }
  ];

  const [rentalHistory, setRentalHistory] = useState<RentalHistory[]>([]);

  const getRentalHistory = useCallback(async () => {
    try {
      const response = await api.get("/bookings/my");
      const bookings = response?.data?.data;
      console.log(bookings);
      setRentalHistory(bookings);
    } catch (error) {
      console.error("Error getting rental history:", error);
    }
  }, []);

  useEffect(() => {
    getRentalHistory();
  }, []);

  const handleComplete = async (rentalId: string) => {
    setCompletingRental(rentalId);
    try {
      // await mockCompleteRental(rentalId);
      // setRentalHistory(
      //   rentalHistory.map((rental) =>
      //     rental.id === rentalId ? { ...rental, status: 'completed' as const } : rental
      //   )
      // );
      toast.success('Rental marked as completed');
    } catch (error) {
      toast.error('Failed to complete rental');
    } finally {
      setCompletingRental(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'active':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'approved':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Rental History</h1>
        <p className="text-muted-foreground mt-2">
          View your past bike rentals and transactions
        </p>
      </div>

      <div className="grid gap-4">
        {rentalHistory.map((rental: any) => (
          <Card key={rental.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{rental?.bike?.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{rental?.bike?.location?.city}, {rental.bike?.location?.state}</span>
                  </div>
                </div>
                <Badge className={getStatusColor(rental?.status?.toLowerCase())}>
                  {rental?.status?.toLowerCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Start Time</p>
                    <p className="font-medium">{rental.startTime}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">End Time</p>
                    <p className="font-medium">{rental.endTime}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Cost</p>
                    <p className="font-medium">${rental?.price ? rental?.price : 0}</p>
                  </div>
                </div>
              </div>

              {rental?.status.toLowerCase() === 'pending' && (
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button
                    onClick={() => handleComplete(rental.id)}
                    disabled={completingRental === rental.id}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    {completingRental === rental.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Completing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Complete
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {rentalHistory.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No rental history yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default History;
