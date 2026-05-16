/**
 * Converso VPN - Shared Types
 */
export type UserRole = 'customer' | 'admin' | 'support';
export type UserStatus = 'active' | 'suspended' | 'deleted';
export type NodeStatus = 'online' | 'offline' | 'maintenance' | 'degraded';
export type NodeTier = 'standard' | 'premium' | 'streaming';
export type PeerStatus = 'active' | 'revoked' | 'suspended';
export type DeviceType = 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'router';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired';
export type BillingCycle = 'monthly' | 'yearly' | 'lifetime';
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';
export type PaymentGateway = 'stripe' | 'paypal' | 'crypto';
export interface User {
    id: string;
    email: string;
    emailVerified: boolean;
    fullName: string;
    avatarUrl?: string;
    role: UserRole;
    status: UserStatus;
    mfaEnabled: boolean;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface VpnNode {
    id: string;
    name: string;
    hostname: string;
    countryCode: string;
    countryName: string;
    city: string;
    ipAddress: string;
    publicKey: string;
    endpoint: string;
    listenPort: number;
    status: NodeStatus;
    tier: NodeTier;
    maxPeers: number;
    currentPeers: number;
    loadPercent: number;
    pingMs?: number;
    bandwidthInMbps?: number;
    bandwidthOutMbps?: number;
    provider?: string;
    monthlyCostUsd?: number;
    lastHeartbeatAt?: Date;
    agentVersion?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface WireGuardPeer {
    id: string;
    userId: string;
    nodeId: string;
    deviceName: string;
    deviceType?: DeviceType;
    publicKey: string;
    assignedIp: string;
    dnsServers: string[];
    allowedIps: string[];
    status: PeerStatus;
    lastHandshakeAt?: Date;
    bytesSent: number;
    bytesReceived: number;
    createdAt: Date;
    updatedAt: Date;
    node?: VpnNode;
}
export interface SubscriptionPlan {
    id: string;
    name: string;
    slug: string;
    priceMonthly: number;
    priceYearly: number;
    priceLifetime?: number;
    maxDevices: number;
    maxBandwidthGb?: number;
    features: string[];
    isActive: boolean;
}
export interface Subscription {
    id: string;
    userId: string;
    planId: string;
    status: SubscriptionStatus;
    billingCycle?: BillingCycle;
    currentPeriodStart: Date;
    currentPeriodEnd?: Date;
    canceledAt?: Date;
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
    createdAt: Date;
    updatedAt: Date;
    plan?: SubscriptionPlan;
}
export interface Payment {
    id: string;
    userId: string;
    subscriptionId?: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    gateway: PaymentGateway;
    gatewayPaymentId: string;
    paidAt?: Date;
    refundedAt?: Date;
    createdAt: Date;
}
export interface NodeMetrics {
    cpuPercent?: number;
    memoryPercent?: number;
    diskPercent?: number;
    activePeers?: number;
    pingMs?: number;
    packetLoss?: number;
    bandwidthInMbps?: number;
    bandwidthOutMbps?: number;
}
export interface TokenResponse {
    accessToken: string;
    refreshToken: string;
}
export interface ApiResponse<T> {
    data: T;
    message?: string;
}
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
//# sourceMappingURL=index.d.ts.map