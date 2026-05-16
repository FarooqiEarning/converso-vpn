/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useQuery } from '@tanstack/react-query';
import { nodesApi } from '@/lib/api';
import { getCountryFlag, cn } from '@/lib/utils';
import { Server, Signal, Zap } from 'lucide-react';

export default function ServersPage() {
  const { data: nodes, isLoading } = useQuery({
    queryKey: ['nodes'],
    queryFn: () => nodesApi.getAll().then((res) => res.data),
  });

  const { data: countries } = useQuery({
    queryKey: ['countries'],
    queryFn: () => nodesApi.getCountries().then((res) => res.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Servers</h1>
        <p className="text-muted-foreground mt-1">Choose a server to connect to</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {countries?.map((country: any) => (
          <button
            key={country.countryCode}
            className="glassmorphism p-4 rounded-xl text-left hover:bg-muted/50 transition"
          >
            <div className="text-2xl mb-2">{getCountryFlag(country.countryCode)}</div>
            <p className="font-medium">{country.countryName}</p>
            <p className="text-sm text-muted-foreground">{country.nodeCount} servers</p>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">All Servers</h2>
        <div className="space-y-3">
          {nodes?.map((node: any) => (
            <div
              key={node.id}
              className="glassmorphism p-4 rounded-xl flex items-center justify-between hover:bg-muted/30 transition"
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'p-3 rounded-lg',
                    node.status === 'online' ? 'bg-green-500/10' : 'bg-red-500/10'
                  )}
                >
                  <Server
                    className={cn(
                      'w-6 h-6',
                      node.status === 'online' ? 'text-green-500' : 'text-red-500'
                    )}
                  />
                </div>
                <div>
                  <p className="font-medium">{node.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {node.city}, {node.countryName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <Signal className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                  <p className="text-sm">{node.pingMs ? `${node.pingMs}ms` : 'N/A'}</p>
                </div>
                <div className="text-center">
                  <Zap className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                  <p className="text-sm">{node.loadPercent?.toFixed(0)}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {node.currentPeers}/{node.maxPeers}
                  </p>
                </div>
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 transition">
                  Connect
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
