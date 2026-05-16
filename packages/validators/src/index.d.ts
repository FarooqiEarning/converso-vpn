/**
 * Converso VPN - Shared Zod Validators
 */
import { z } from 'zod';
export declare const emailSchema: z.ZodString;
export declare const passwordSchema: z.ZodString;
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    fullName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    fullName: string;
}, {
    email: string;
    password: string;
    fullName: string;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const refreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const uuidSchema: z.ZodString;
export declare const createDeviceSchema: z.ZodObject<{
    nodeId: z.ZodString;
    deviceName: z.ZodString;
    deviceType: z.ZodOptional<z.ZodEnum<["ios", "android", "windows", "macos", "linux", "router"]>>;
}, "strip", z.ZodTypeAny, {
    nodeId: string;
    deviceName: string;
    deviceType?: "ios" | "android" | "windows" | "macos" | "linux" | "router" | undefined;
}, {
    nodeId: string;
    deviceName: string;
    deviceType?: "ios" | "android" | "windows" | "macos" | "linux" | "router" | undefined;
}>;
export declare const updateDeviceSchema: z.ZodObject<{
    deviceName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    deviceName: string;
}, {
    deviceName: string;
}>;
export declare const switchNodeSchema: z.ZodObject<{
    nodeId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    nodeId: string;
}, {
    nodeId: string;
}>;
export declare const createCheckoutSchema: z.ZodObject<{
    planId: z.ZodString;
    billingCycle: z.ZodEnum<["monthly", "yearly", "lifetime"]>;
}, "strip", z.ZodTypeAny, {
    planId: string;
    billingCycle: "monthly" | "yearly" | "lifetime";
}, {
    planId: string;
    billingCycle: "monthly" | "yearly" | "lifetime";
}>;
export declare const nodeHeartbeatSchema: z.ZodObject<{
    cpuPercent: z.ZodOptional<z.ZodNumber>;
    memoryPercent: z.ZodOptional<z.ZodNumber>;
    activePeers: z.ZodOptional<z.ZodNumber>;
    pingMs: z.ZodOptional<z.ZodNumber>;
    bandwidthInMbps: z.ZodOptional<z.ZodNumber>;
    bandwidthOutMbps: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    cpuPercent?: number | undefined;
    memoryPercent?: number | undefined;
    activePeers?: number | undefined;
    pingMs?: number | undefined;
    bandwidthInMbps?: number | undefined;
    bandwidthOutMbps?: number | undefined;
}, {
    cpuPercent?: number | undefined;
    memoryPercent?: number | undefined;
    activePeers?: number | undefined;
    pingMs?: number | undefined;
    bandwidthInMbps?: number | undefined;
    bandwidthOutMbps?: number | undefined;
}>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: number | undefined;
    limit?: number | undefined;
}>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;
export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>;
export type SwitchNodeInput = z.infer<typeof switchNodeSchema>;
export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
export type NodeHeartbeatInput = z.infer<typeof nodeHeartbeatSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
//# sourceMappingURL=index.d.ts.map