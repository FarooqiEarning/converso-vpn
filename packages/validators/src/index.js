/**
 * Converso VPN - Shared Zod Validators
 */
import { z } from 'zod';
export const emailSchema = z.string().email();
export const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number');
export const registerSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    fullName: z.string().min(1).max(255),
});
export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1),
});
export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1),
});
export const uuidSchema = z.string().uuid();
export const createDeviceSchema = z.object({
    nodeId: uuidSchema,
    deviceName: z.string().min(1).max(100),
    deviceType: z.enum(['ios', 'android', 'windows', 'macos', 'linux', 'router']).optional(),
});
export const updateDeviceSchema = z.object({
    deviceName: z.string().min(1).max(100),
});
export const switchNodeSchema = z.object({
    nodeId: uuidSchema,
});
export const createCheckoutSchema = z.object({
    planId: uuidSchema,
    billingCycle: z.enum(['monthly', 'yearly', 'lifetime']),
});
export const nodeHeartbeatSchema = z.object({
    cpuPercent: z.number().min(0).max(100).optional(),
    memoryPercent: z.number().min(0).max(100).optional(),
    activePeers: z.number().int().min(0).optional(),
    pingMs: z.number().int().min(0).optional(),
    bandwidthInMbps: z.number().min(0).optional(),
    bandwidthOutMbps: z.number().min(0).optional(),
});
export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});
//# sourceMappingURL=index.js.map