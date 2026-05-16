'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { User, Lock, Shield, Trash2 } from 'lucide-react'
import { usersApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

export default function SettingsPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [fullName, setFullName] = useState(session?.user?.name || '')

  const updateMutation = useMutation({
    mutationFn: (data: { fullName: string }) => usersApi.updateProfile(data),
    onSuccess: () => {
      toast({ title: 'Profile updated' })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => usersApi.deleteAccount(),
    onSuccess: () => {
      window.location.href = '/'
    },
  })

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate({ fullName })
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings</p>
      </div>

      <div className="glassmorphism p-6 rounded-xl">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Profile</h2>
        </div>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              value={session?.user?.email || ''}
              disabled
              className="w-full px-4 py-3 bg-muted border border-border rounded-lg opacity-60"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Button type="submit" disabled={updateMutation.isPending}>
            Save Changes
          </Button>
        </form>
      </div>

      <div className="glassmorphism p-6 rounded-xl">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Security</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Password</p>
              <p className="text-sm text-muted-foreground">Last changed: Never</p>
            </div>
            <Button variant="outline">Change</Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
            </div>
            <Button variant="outline">Enable</Button>
          </div>
        </div>
      </div>

      <div className="glassmorphism p-6 rounded-xl border-destructive/50">
        <div className="flex items-center gap-3 mb-6">
          <Trash2 className="w-5 h-5 text-destructive" />
          <h2 className="text-xl font-semibold text-destructive">Danger Zone</h2>
        </div>
        <p className="text-muted-foreground mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <Button
          variant="destructive"
          onClick={() => {
            if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
              deleteMutation.mutate()
            }
          }}
        >
          Delete Account
        </Button>
      </div>
    </div>
  )
}