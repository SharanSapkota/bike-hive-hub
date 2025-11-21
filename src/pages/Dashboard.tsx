import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Backpack, DollarSign, Package, TrendingUp, Users } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();

  const renterStats = [
    { label: 'Total Rentals', value: '0', icon: Package, color: 'text-blue-600' },
    { label: 'Money Spent', value: 'EUR 0', icon: DollarSign, color: 'text-green-600' },
    { label: 'Active Rentals', value: '0', icon: TrendingUp, color: 'text-purple-600' },
    { label: 'Favorite Gear', value: '0', icon: Backpack, color: 'text-orange-600' },
  ];

  const ownerStats = [
    { label: 'Total Gear', value: '0', icon: Backpack, color: 'text-blue-600' },
    { label: 'Total Earnings', value: 'EUR 0', icon: DollarSign, color: 'text-green-600' },
    { label: 'Active Rentals', value: '0', icon: Package, color: 'text-purple-600' },
    { label: 'Total Rentals', value: '0', icon: TrendingUp, color: 'text-orange-600' },
  ];

  const adminStats = [
    { label: 'Total Users', value: '1,234', icon: Users, color: 'text-blue-600' },
    { label: 'Total Gear', value: '456', icon: Backpack, color: 'text-green-600' },
    { label: 'Active Rentals', value: '89', icon: Package, color: 'text-purple-600' },
    { label: 'Revenue', value: '$12,450', icon: DollarSign, color: 'text-orange-600' },
  ];

  const activity = []

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
            {activity.length > 0 ? (
            activity.map((item) => (
              <div key={item} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Backpack className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Gear rental completed</p>
                  <p className="text-sm text-muted-foreground">2 hours ago</p>
                </div>
                <p className="font-medium text-primary">$12.00</p>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No activity found</p>
            </div>
          )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
