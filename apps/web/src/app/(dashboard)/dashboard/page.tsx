/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { Server, Smartphone, Activity, Clock } from 'lucide-react';
import { subscriptionsApi, devicesApi, usersApi } from '@/lib/api';
import { formatBytes } from '@/lib/utils';

export default function DashboardPage() {
  const { data: session } = useSession();

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => subscriptionsApi.getCurrent().then((res) => res.data),
  });

  const { data: devices } = useQuery({
    queryKey: ['devices'],
    queryFn: () => devicesApi.getAll().then((res) => res.data),
  });

  const { data: usage } = useQuery({
    queryKey: ['usage'],
    queryFn: () => usersApi.getUsage().then((res) => res.data),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {session?.user?.name || 'User'}</h1>
        <p className="text-muted-foreground mt-1">Here&apos;s your VPN overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glassmorphism p-6 rounded-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Status</p>
              <p className="text-xl font-semibold text-primary">Connected</p>
            </div>
          </div>
        </div>

        <div className="glassmorphism p-6 rounded-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-secondary/10 rounded-lg">
              <Server className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Current Server</p>
              <p className="text-xl font-semibold">Singapore #1</p>
            </div>
          </div>
        </div>

        <div className="glassmorphism p-6 rounded-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Smartphone className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Active Devices</p>
              <p className="text-xl font-semibold">{devices?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="glassmorphism p-6 rounded-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <Clock className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Data Used</p>
              <p className="text-xl font-semibold">{formatBytes(usage?.totalBandwidth || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glassmorphism p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Subscription</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">{subscription?.plan?.name || 'No Plan'}</p>
                <p className="text-sm text-muted-foreground">
                  {subscription?.billingCycle || 'N/A'} billing
                </p>
              </div>
              <span className="px-3 py-1 bg-primary/20 text-primary text-sm rounded-full">
                {subscription?.status || 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        <div className="glassmorphism p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Recent Devices</h2>
          <div className="space-y-3">
            {devices?.slice(0, 3).map((device: any) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-4 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{device.deviceName}</p>
                    <p className="text-sm text-muted-foreground">{device.node?.name}</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-green-500/20 text-green-500 text-xs rounded">
                  {device.status}
                </span>
              </div>
            ))}
            {(!devices || devices.length === 0) && (
              <p className="text-muted-foreground text-center py-4">No devices yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
