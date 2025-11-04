import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bike, Calendar, Clock, User, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RentalRequest {
  id: string;
  renterName: string;
  bikeName: string;
  requestDate: Date;
  startDate: Date;
  endDate: Date;
  duration: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
}

const mockRequests: RentalRequest[] = [
  {
    id: '1',
    renterName: 'John Doe',
    bikeName: 'Mountain Bike',
    requestDate: new Date(Date.now() - 1000 * 60 * 5),
    startDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
    duration: '3 days',
    amount: 75,
    status: 'pending',
  },
  {
    id: '2',
    renterName: 'Sarah Smith',
    bikeName: 'Road Bike',
    requestDate: new Date(Date.now() - 1000 * 60 * 30),
    startDate: new Date(Date.now() + 1000 * 60 * 60 * 48),
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
    duration: '3 days',
    amount: 90,
    status: 'pending',
  },
  {
    id: '3',
    renterName: 'Mike Johnson',
    bikeName: 'City Bike',
    requestDate: new Date(Date.now() - 1000 * 60 * 60),
    startDate: new Date(Date.now() + 1000 * 60 * 60 * 72),
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    duration: '4 days',
    amount: 60,
    status: 'pending',
  },
];

const RentalRequests = () => {
  const [requests, setRequests] = useState<RentalRequest[]>(mockRequests);
  const { toast } = useToast();

  const handleApprove = (requestId: string) => {
    setRequests(prev =>
      prev.map(req =>
        req.id === requestId ? { ...req, status: 'approved' as const } : req
      )
    );
    toast({
      title: 'Request Approved',
      description: 'The rental request has been approved successfully.',
    });
  };

  const handleReject = (requestId: string) => {
    setRequests(prev =>
      prev.map(req =>
        req.id === requestId ? { ...req, status: 'rejected' as const } : req
      )
    );
    toast({
      title: 'Request Rejected',
      description: 'The rental request has been rejected.',
      variant: 'destructive',
    });
  };

  const getStatusColor = (status: RentalRequest['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'approved':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'rejected':
        return 'bg-destructive/10 text-destructive border-destructive/20';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Rental Requests</h1>
        <p className="text-muted-foreground mt-2">
          Review and manage rental requests for your bikes
        </p>
      </div>

      {pendingRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Pending Requests
            <Badge variant="secondary">{pendingRequests.length}</Badge>
          </h2>
          
          <div className="grid gap-4">
            {pendingRequests.map((request) => (
              <Card key={request.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Bike className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{request.bikeName}</h3>
                        <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span className="text-sm">{request.renterName}</span>
                        </div>
                      </div>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground text-xs">Start Date</p>
                          <p className="font-medium">{formatDate(request.startDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground text-xs">End Date</p>
                          <p className="font-medium">{formatDate(request.endDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground text-xs">Duration</p>
                          <p className="font-medium">{request.duration}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-muted-foreground">Total Amount</span>
                      <span className="text-2xl font-bold text-primary">${request.amount}</span>
                    </div>
                  </div>

                  {request.status === 'pending' && (
                    <div className="flex lg:flex-col gap-2">
                      <Button
                        onClick={() => handleApprove(request.id)}
                        className="flex-1 lg:flex-none"
                        size="lg"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleReject(request.id)}
                        variant="destructive"
                        className="flex-1 lg:flex-none"
                        size="lg"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {processedRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-muted-foreground" />
            Processed Requests
          </h2>
          
          <div className="grid gap-4">
            {processedRequests.map((request) => (
              <Card key={request.id} className="p-6 opacity-60">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-muted">
                        <Bike className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{request.bikeName}</h3>
                        <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span className="text-sm">{request.renterName}</span>
                        </div>
                      </div>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground text-xs">Start Date</p>
                          <p className="font-medium">{formatDate(request.startDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground text-xs">End Date</p>
                          <p className="font-medium">{formatDate(request.endDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground text-xs">Duration</p>
                          <p className="font-medium">{request.duration}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-muted-foreground">Total Amount</span>
                      <span className="text-xl font-bold">${request.amount}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {requests.length === 0 && (
        <Card className="p-12 text-center">
          <Bike className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
          <h3 className="text-lg font-semibold mb-2">No rental requests yet</h3>
          <p className="text-muted-foreground">
            When renters request your bikes, they'll appear here
          </p>
        </Card>
      )}
    </div>
  );
};

export default RentalRequests;