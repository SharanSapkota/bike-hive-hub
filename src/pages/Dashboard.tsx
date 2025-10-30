import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bike, DollarSign, Package, TrendingUp, Users } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();

  const renterStats = [
    { label: 'Total Rentals', value: '12', icon: Package, color: 'text-blue-600' },
    { label: 'Money Spent', value: '$245', icon: DollarSign, color: 'text-green-600' },
    { label: 'Active Rentals', value: '1', icon: TrendingUp, color: 'text-purple-600' },
    { label: 'Favorite Bikes', value: '3', icon: Bike, color: 'text-orange-600' },
  ];

  const ownerStats = [
    { label: 'Total Bikes', value: '8', icon: Bike, color: 'text-blue-600' },
    { label: 'Total Earnings', value: '$1,245', icon: DollarSign, color: 'text-green-600' },
    { label: 'Active Rentals', value: '3', icon: Package, color: 'text-purple-600' },
    { label: 'Total Rentals', value: '45', icon: TrendingUp, color: 'text-orange-600' },
  ];

  const adminStats = [
    { label: 'Total Users', value: '1,234', icon: Users, color: 'text-blue-600' },
    { label: 'Total Bikes', value: '456', icon: Bike, color: 'text-green-600' },
    { label: 'Active Rentals', value: '89', icon: Package, color: 'text-purple-600' },
    { label: 'Revenue', value: '$12,450', icon: DollarSign, color: 'text-orange-600' },
  ];

  const stats = user?.role === 'admin' ? adminStats : user?.role === 'owner' ? ownerStats : renterStats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name}!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest transactions and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bike className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Bike rental completed</p>
                  <p className="text-sm text-muted-foreground">2 hours ago</p>
                </div>
                <p className="font-medium text-primary">$12.00</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
