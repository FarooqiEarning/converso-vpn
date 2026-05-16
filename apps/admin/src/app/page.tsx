'use client';

import { useQuery } from '@tanstack/react-query';
import { Users, Server, CreditCard, Activity, DollarSign, TrendingUp } from 'lucide-react';
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1',
});

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const token = localStorage.getItem('admin-token');
      const res = await api.get('/analytics/overview', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return res.data;
    },
  });

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-500' },
    {
      label: 'Active Subscriptions',
      value: stats?.activeSubscriptions || 0,
      icon: CreditCard,
      color: 'text-green-500',
    },
    {
      label: 'Active Nodes',
      value: stats?.activeNodes || 0,
      icon: Server,
      color: 'text-purple-500',
    },
    {
      label: 'Active Peers',
      value: stats?.activePeers || 0,
      icon: Activity,
      color: 'text-orange-500',
    },
    {
      label: 'Total Revenue',
      value: `$${(stats?.totalRevenue || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'text-yellow-500',
    },
    { label: 'Growth', value: '+12%', icon: TrendingUp, color: 'text-emerald-500' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage your VPN platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div key={index} className="glassmorphism p-6 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glassmorphism p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 bg-muted rounded-lg hover:bg-muted/80 transition text-left">
                <Users className="w-5 h-5 text-primary mb-2" />
                <p className="font-medium">Manage Users</p>
              </button>
              <button className="p-4 bg-muted rounded-lg hover:bg-muted/80 transition text-left">
                <Server className="w-5 h-5 text-primary mb-2" />
                <p className="font-medium">Manage Nodes</p>
              </button>
              <button className="p-4 bg-muted rounded-lg hover:bg-muted/80 transition text-left">
                <CreditCard className="w-5 h-5 text-primary mb-2" />
                <p className="font-medium">View Payments</p>
              </button>
              <button className="p-4 bg-muted rounded-lg hover:bg-muted/80 transition text-left">
                <Activity className="w-5 h-5 text-primary mb-2" />
                <p className="font-medium">System Health</p>
              </button>
            </div>
          </div>

          <div className="glassmorphism p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-sm">New user registered</p>
                  <p className="text-xs text-muted-foreground">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-sm">Payment received</p>
                  <p className="text-xs text-muted-foreground">15 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-sm">Node sg1 went online</p>
                  <p className="text-xs text-muted-foreground">1 hour ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
