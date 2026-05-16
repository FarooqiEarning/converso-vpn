'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, CreditCard, ExternalLink } from 'lucide-react'
import { subscriptionsApi, billingApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

export default function BillingPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => subscriptionsApi.getPlans().then(res => res.data),
  })

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => subscriptionsApi.getCurrent().then(res => res.data),
  })

  const { data: payments } = useQuery({
    queryKey: ['payments'],
    queryFn: () => billingApi.getHistory().then(res => res.data),
  })

  const checkoutMutation = useMutation({
    mutationFn: (data: { planId: string; billingCycle: string }) =>
      billingApi.createCheckout(data),
    onSuccess: (res) => {
      if (res.data.checkoutUrl) {
        window.location.href = res.data.checkoutUrl
      }
    },
    onError: () => {
      toast({ title: 'Failed to create checkout', variant: 'destructive' })
    },
  })

  const portalMutation = useMutation({
    mutationFn: () => billingApi.createPortal(),
    onSuccess: (res) => {
      if (res.data.portalUrl) {
        window.location.href = res.data.portalUrl
      }
    },
    onError: () => {
      toast({ title: 'Failed to open billing portal', variant: 'destructive' })
    },
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground mt-1">Manage your subscription and payment methods</p>
      </div>

      {subscription && (
        <div className="glassmorphism p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Current Plan</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{subscription.plan?.name}</p>
              <p className="text-muted-foreground">
                {subscription.billingCycle} billing • Renews {subscription.currentPeriodEnd}
              </p>
            </div>
            <Button variant="outline" onClick={() => portalMutation.mutate()}>
              <CreditCard className="w-4 h-4 mr-2" />
              Manage Billing
            </Button>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans?.map((plan: any) => (
            <div
              key={plan.id}
              className={`glassmorphism p-6 rounded-xl ${
                subscription?.planId === plan.id ? 'border-primary border-2' : ''
              }`}
            >
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <div className="mt-4 mb-6">
                <span className="text-3xl font-bold">${plan.priceMonthly}</span>
                <span className="text-muted-foreground">/month</span>
                {plan.priceYearly > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    or ${plan.priceYearly}/year (save {Math.round((1 - plan.priceYearly / (plan.priceMonthly * 12)) * 100)}%)
                  </p>
                )}
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features?.map((feature: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    {feature}
                  </li>
                ))}
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary" />
                  {plan.maxDevices === -1 ? 'Unlimited' : plan.maxDevices} devices
                </li>
              </ul>
              {subscription?.planId === plan.id ? (
                <Button className="w-full" disabled>
                  Current Plan
                </Button>
              ) : (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => checkoutMutation.mutate({ planId: plan.id, billingCycle: 'monthly' })}
                >
                  {subscription ? 'Upgrade' : 'Subscribe'}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Payment History</h2>
        <div className="glassmorphism rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Date</th>
                <th className="text-left p-4 font-medium">Amount</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {payments?.map((payment: any) => (
                <tr key={payment.id} className="border-t border-border">
                  <td className="p-4">{new Date(payment.createdAt).toLocaleDateString()}</td>
                  <td className="p-4">${payment.amount.toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      payment.status === 'succeeded' ? 'bg-green-500/20 text-green-500' :
                      payment.status === 'failed' ? 'bg-red-500/20 text-red-500' :
                      'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <button className="text-primary hover:underline text-sm flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {(!payments || payments.length === 0) && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    No payment history
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}