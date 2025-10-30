import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Clock, DollarSign, User, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Rental {
  id: string;
  bikeName: string;
  renterName: string;
  renterEmail: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  amount: number;
  duration: string;
}

// Mock data
const mockRentals: Rental[] = [
  {
    id: '1',
    bikeName: 'Mountain Explorer Pro',
    renterName: 'John Doe',
    renterEmail: 'john@example.com',
    startDate: '2025-10-28',
    endDate: '2025-10-30',
    status: 'active',
    amount: 48,
    duration: '2 days',
  },
  {
    id: '2',
    bikeName: 'City Cruiser Deluxe',
    renterName: 'Jane Smith',
    renterEmail: 'jane@example.com',
    startDate: '2025-10-30',
    endDate: '2025-10-30',
    status: 'pending',
    amount: 20,
    duration: '4 hours',
  },
  {
    id: '3',
    bikeName: 'Road Racer Speed',
    renterName: 'Mike Johnson',
    renterEmail: 'mike@example.com',
    startDate: '2025-10-25',
    endDate: '2025-10-27',
    status: 'completed',
    amount: 120,
    duration: '2 days',
  },
];

const Rentals = () => {
  const [rentals, setRentals] = useState<Rental[]>(mockRentals);

  const getStatusColor = (status: Rental['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'active':
        return 'bg-green-500';
      case 'completed':
        return 'bg-blue-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleApprove = (rentalId: string) => {
    setRentals(
      rentals.map((rental) =>
        rental.id === rentalId ? { ...rental, status: 'active' as const } : rental
      )
    );
    toast.success('Rental approved');
  };

  const handleReject = (rentalId: string) => {
    setRentals(
      rentals.map((rental) =>
        rental.id === rentalId ? { ...rental, status: 'cancelled' as const } : rental
      )
    );
    toast.success('Rental rejected');
  };

  const stats = {
    total: rentals.length,
    pending: rentals.filter((r) => r.status === 'pending').length,
    active: rentals.filter((r) => r.status === 'active').length,
    completed: rentals.filter((r) => r.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Rentals</h1>
        <p className="text-muted-foreground">Manage your bike rental requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Rentals
            </CardTitle>
            <Package className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
            <Clock className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active
            </CardTitle>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Rentals List */}
      <div className="space-y-4">
        {rentals.map((rental) => (
          <Card key={rental.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{rental.bikeName}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <User className="h-3 w-3" />
                    {rental.renterName} • {rental.renterEmail}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(rental.status)}>
                  {rental.status.charAt(0).toUpperCase() + rental.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">{rental.startDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">{rental.endDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">{rental.duration}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium text-primary text-lg">${rental.amount}</p>
                </div>
              </div>

              {rental.status === 'pending' && (
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button
                    onClick={() => handleApprove(rental.id)}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleReject(rental.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {rentals.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No rentals yet</h3>
            <p className="text-muted-foreground">
              Rental requests will appear here once users book your bikes
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Rentals;
