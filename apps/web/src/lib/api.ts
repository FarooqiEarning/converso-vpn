import axios from 'axios'
import { signOut, getSession } from 'next-auth/react'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(async (config) => {
  const session = await getSession()
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await signOut({ callbackUrl: '/login' })
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  register: (data: { email: string; password: string; fullName: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  refresh: (data: { refreshToken: string }) =>
    api.post('/auth/refresh', data),
  logout: () => api.post('/auth/logout'),
  googleLogin: (accessToken: string) =>
    api.post('/auth/google', { accessToken }),
}

export const usersApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: { fullName?: string; avatarUrl?: string }) =>
    api.patch('/users/me', data),
  deleteAccount: () => api.delete('/users/me'),
  getUsage: () => api.get('/users/me/usage'),
}

export const nodesApi = {
  getAll: () => api.get('/nodes'),
  getById: (id: string) => api.get(`/nodes/${id}`),
  getRecommended: (latency?: number) =>
    api.get('/nodes/recommend', { params: { latency } }),
  getCountries: () => api.get('/nodes/countries'),
}

export const devicesApi = {
  getAll: () => api.get('/devices'),
  create: (data: { nodeId: string; deviceName: string; deviceType?: string }) =>
    api.post('/devices', data),
  getById: (id: string) => api.get(`/devices/${id}`),
  update: (id: string, data: { deviceName: string }) =>
    api.patch(`/devices/${id}`, data),
  switchNode: (id: string, nodeId: string) =>
    api.patch(`/devices/${id}/node`, { nodeId }),
  delete: (id: string) => api.delete(`/devices/${id}`),
  getConfig: (id: string) => api.get(`/wireguard/config/${id}`),
  downloadConfig: (id: string) =>
    api.get(`/wireguard/config/${id}/download`, { responseType: 'blob' }),
  getQR: (id: string) => api.get(`/wireguard/qr/${id}`, { responseType: 'blob' }),
}

export const subscriptionsApi = {
  getPlans: () => api.get('/subscriptions/plans'),
  getCurrent: () => api.get('/subscriptions/current'),
  cancel: () => api.delete('/subscriptions/current'),
}

export const billingApi = {
  createCheckout: (data: { planId: string; billingCycle: string }) =>
    api.post('/billing/checkout', data),
  createPortal: () => api.post('/billing/portal'),
  getHistory: () => api.get('/billing/history'),
}

export default api