/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Smartphone, Download, Trash2, QrCode } from 'lucide-react';
import { devicesApi, nodesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function DevicesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const { data: devices, isLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: () => devicesApi.getAll().then((res) => res.data),
  });

  const { data: nodes } = useQuery({
    queryKey: ['nodes'],
    queryFn: () => nodesApi.getAll().then((res: any) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: { nodeId: string; deviceName: string; deviceType?: string }) =>
      devicesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      setIsCreating(false);
      toast({ title: 'Device created successfully' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => devicesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast({ title: 'Device deleted' });
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      nodeId: formData.get('nodeId') as string,
      deviceName: formData.get('deviceName') as string,
      deviceType: formData.get('deviceType') as string,
    });
  };

  const handleDownload = async (deviceId: string) => {
    try {
      const response = await devicesApi.downloadConfig(deviceId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'converso-vpn.conf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast({ title: 'Failed to download config', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Devices</h1>
          <p className="text-muted-foreground mt-1">Manage your WireGuard devices</p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Device
        </Button>
      </div>

      {isCreating && (
        <div className="glassmorphism p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Add New Device</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Device Name</label>
              <input
                name="deviceName"
                required
                className="w-full px-4 py-3 bg-muted border border-border rounded-lg"
                placeholder="iPhone 15 Pro"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Server</label>
              <select
                name="nodeId"
                required
                className="w-full px-4 py-3 bg-muted border border-border rounded-lg"
              >
                {nodes?.map((node: any) => (
                  <option key={node.id} value={node.id}>
                    {node.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Device Type</label>
              <select
                name="deviceType"
                className="w-full px-4 py-3 bg-muted border border-border rounded-lg"
              >
                <option value="ios">iOS</option>
                <option value="android">Android</option>
                <option value="windows">Windows</option>
                <option value="macos">macOS</option>
                <option value="linux">Linux</option>
                <option value="router">Router</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={createMutation.isPending}>
                Create Device
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {devices?.map((device: any) => (
          <div key={device.id} className="glassmorphism p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Smartphone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-medium">{device.deviceName}</p>
                  <p className="text-sm text-muted-foreground">
                    {device.node?.name} • {device.assignedIp}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleDownload(device.id)}>
                  <Download className="w-4 h-4 mr-1" />
                  Config
                </Button>
                <Button variant="outline" size="sm">
                  <QrCode className="w-4 h-4 mr-1" />
                  QR
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteMutation.mutate(device.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {(!devices || devices.length === 0) && !isCreating && (
          <div className="text-center py-12">
            <Smartphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No devices yet</p>
            <Button className="mt-4" onClick={() => setIsCreating(true)}>
              Add your first device
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
