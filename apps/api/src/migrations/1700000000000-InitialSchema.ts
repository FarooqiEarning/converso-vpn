/**
 * Converso VPN - Initial Database Schema Migration
 * Creates all tables for the VPN platform
 */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- Users table
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" varchar(255) UNIQUE NOT NULL,
        "emailVerified" boolean DEFAULT false,
        "passwordHash" varchar(255),
        "googleId" varchar(255) UNIQUE,
        "fullName" varchar(255) NOT NULL,
        "avatarUrl" text,
        "role" varchar(20) DEFAULT 'customer',
        "status" varchar(20) DEFAULT 'active',
        "mfaEnabled" boolean DEFAULT false,
        "mfaSecret" varchar(255),
        "lastLoginAt" timestamptz,
        "lastLoginIp" inet,
        "createdAt" timestamptz DEFAULT now(),
        "updatedAt" timestamptz DEFAULT now(),
        "deletedAt" timestamptz
      );
      CREATE INDEX "idx_users_email" ON "users" ("email");
      CREATE INDEX "idx_users_google_id" ON "users" ("googleId");
      CREATE INDEX "idx_users_status" ON "users" ("status");

      -- Audit Logs table
      CREATE TABLE "audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid REFERENCES "users"("id") ON DELETE CASCADE,
        "action" varchar(100) NOT NULL,
        "entityType" varchar(50),
        "entityId" varchar(255),
        "oldValue" text,
        "newValue" text,
        "ipAddress" inet,
        "userAgent" text,
        "createdAt" timestamptz DEFAULT now()
      );
      CREATE INDEX "idx_audit_logs_user_id" ON "audit_logs" ("userId");
      CREATE INDEX "idx_audit_logs_action" ON "audit_logs" ("action");
      CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs" ("createdAt");

      -- VPN Nodes table
      CREATE TABLE "vpn_nodes" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL,
        "publicKey" varchar(255) UNIQUE NOT NULL,
        "privateKey" varchar(255) NOT NULL,
        "address" varchar(45) NOT NULL,
        "port" integer NOT NULL DEFAULT 51820,
        "dns" varchar(255) DEFAULT '1.1.1.1,1.0.0.1',
        "endpoint" varchar(255),
        "country" varchar(2),
        "city" varchar(100),
        "latitude" decimal(10,8),
        "longitude" decimal(11,8),
        "status" varchar(20) DEFAULT 'offline',
        "currentLoad" integer DEFAULT 0,
        "maxLoad" integer DEFAULT 100,
        "totalTraffic" bigint DEFAULT 0,
        "onlineUsers" integer DEFAULT 0,
        "isActive" boolean DEFAULT true,
        "isPremium" boolean DEFAULT false,
        "lastHeartbeat" timestamptz,
        "createdAt" timestamptz DEFAULT now(),
        "updatedAt" timestamptz DEFAULT now()
      );
      CREATE INDEX "idx_vpn_nodes_status" ON "vpn_nodes" ("status");
      CREATE INDEX "idx_vpn_nodes_country" ON "vpn_nodes" ("country");
      CREATE INDEX "idx_vpn_nodes_is_active" ON "vpn_nodes" ("isActive");

      -- Node Metrics table
      CREATE TABLE "node_metrics" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "nodeId" uuid REFERENCES "vpn_nodes"("id") ON DELETE CASCADE,
        "cpuUsage" integer DEFAULT 0,
        "memoryUsage" integer DEFAULT 0,
        "diskUsage" integer DEFAULT 0,
        "networkIn" bigint DEFAULT 0,
        "networkOut" bigint DEFAULT 0,
        "activeConnections" integer DEFAULT 0,
        "temperature" integer,
        "recordedAt" timestamptz DEFAULT now()
      );
      CREATE INDEX "idx_node_metrics_node_id" ON "node_metrics" ("nodeId");
      CREATE INDEX "idx_node_metrics_recorded_at" ON "node_metrics" ("recordedAt");

      -- Wireguard Peers table
      CREATE TABLE "wireguard_peers" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid REFERENCES "users"("id") ON DELETE CASCADE,
        "nodeId" uuid REFERENCES "vpn_nodes"("id") ON DELETE SET NULL,
        "publicKey" varchar(255) UNIQUE NOT NULL,
        "privateKey" varchar(255) NOT NULL,
        "preSharedKey" varchar(255),
        "allowedIPs" text NOT NULL DEFAULT '0.0.0.0/0,::/0',
        "endpoint" varchar(255),
        "persistentKeepalive" integer DEFAULT 25,
        "status" varchar(20) DEFAULT 'disconnected',
        "lastHandshakeAt" timestamptz,
        "bytesReceived" bigint DEFAULT 0,
        "bytesSent" bigint DEFAULT 0,
        "createdAt" timestamptz DEFAULT now(),
        "updatedAt" timestamptz DEFAULT now()
      );
      CREATE INDEX "idx_wireguard_peers_user_id" ON "wireguard_peers" ("userId");
      CREATE INDEX "idx_wireguard_peers_node_id" ON "wireguard_peers" ("nodeId");
      CREATE INDEX "idx_wireguard_peers_status" ON "wireguard_peers" ("status");

      -- Sessions table
      CREATE TABLE "sessions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid REFERENCES "users"("id") ON DELETE CASCADE,
        "nodeId" uuid REFERENCES "vpn_nodes"("id") ON DELETE SET NULL,
        "peerId" uuid REFERENCES "wireguard_peers"("id") ON DELETE SET NULL,
        "sessionKey" varchar(64) UNIQUE NOT NULL,
        "ipAddress" varchar(45),
        "country" varchar(2),
        "city" varchar(100),
        "connectionType" varchar(20) DEFAULT 'wireguard',
        "status" varchar(20) DEFAULT 'active',
        "connectedAt" timestamptz DEFAULT now(),
        "disconnectedAt" timestamptz,
        "bytesReceived" bigint DEFAULT 0,
        "bytesSent" bigint DEFAULT 0,
        "duration" integer DEFAULT 0
      );
      CREATE INDEX "idx_sessions_user_id" ON "sessions" ("userId");
      CREATE INDEX "idx_sessions_node_id" ON "sessions" ("nodeId");
      CREATE INDEX "idx_sessions_status" ON "sessions" ("status");
      CREATE INDEX "idx_sessions_connected_at" ON "sessions" ("connectedAt");

      -- Subscription Plans table
      CREATE TABLE "subscription_plans" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(100) NOT NULL,
        "description" text,
        "price" decimal(10,2) NOT NULL,
        "billingPeriod" varchar(20) DEFAULT 'monthly',
        "currency" varchar(3) DEFAULT 'USD',
        "dataLimit" bigint,
        "bandwidthLimit" bigint,
        "deviceLimit" integer DEFAULT 1,
        "speedLimit" integer,
        "features" text,
        "isActive" boolean DEFAULT true,
        "isFeatured" boolean DEFAULT false,
        "stripePriceId" varchar(255),
        "createdAt" timestamptz DEFAULT now(),
        "updatedAt" timestamptz DEFAULT now()
      );
      CREATE INDEX "idx_subscription_plans_is_active" ON "subscription_plans" ("isActive");

      -- Subscriptions table
      CREATE TABLE "subscriptions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid REFERENCES "users"("id") ON DELETE CASCADE,
        "planId" uuid REFERENCES "subscription_plans"("id") ON DELETE SET NULL,
        "stripeSubscriptionId" varchar(255),
        "stripeCustomerId" varchar(255),
        "status" varchar(20) DEFAULT 'incomplete',
        "currentPeriodStart" timestamptz,
        "currentPeriodEnd" timestamptz,
        "cancelAtPeriodEnd" boolean DEFAULT false,
        "canceledAt" timestamptz,
        "createdAt" timestamptz DEFAULT now(),
        "updatedAt" timestamptz DEFAULT now()
      );
      CREATE INDEX "idx_subscriptions_user_id" ON "subscriptions" ("userId");
      CREATE INDEX "idx_subscriptions_status" ON "subscriptions" ("status");

      -- Payments table
      CREATE TABLE "payments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid REFERENCES "users"("id") ON DELETE CASCADE,
        "subscriptionId" uuid REFERENCES "subscriptions"("id") ON DELETE SET NULL,
        "stripePaymentIntentId" varchar(255) UNIQUE,
        "stripeInvoiceId" varchar(255),
        "amount" decimal(10,2) NOT NULL,
        "currency" varchar(3) DEFAULT 'USD',
        "status" varchar(20) DEFAULT 'pending',
        "type" varchar(20) DEFAULT 'subscription',
        "description" text,
        "metadata" text,
        "paidAt" timestamptz,
        "createdAt" timestamptz DEFAULT now(),
        "updatedAt" timestamptz DEFAULT now()
      );
      CREATE INDEX "idx_payments_user_id" ON "payments" ("userId");
      CREATE INDEX "idx_payments_status" ON "payments" ("status");
      CREATE INDEX "idx_payments_stripe_payment_intent_id" ON "payments" ("stripePaymentIntentId");

      -- Devices table
      CREATE TABLE "devices" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid REFERENCES "users"("id") ON DELETE CASCADE,
        "name" varchar(100) NOT NULL,
        "type" varchar(50) DEFAULT 'unknown',
        "os" varchar(50),
        "osVersion" varchar(50),
        "browser" varchar(50),
        "browserVersion" varchar(50),
        "deviceId" varchar(255) UNIQUE,
        "fingerprint" text,
        "lastSeenAt" timestamptz,
        "isActive" boolean DEFAULT true,
        "createdAt" timestamptz DEFAULT now(),
        "updatedAt" timestamptz DEFAULT now()
      );
      CREATE INDEX "idx_devices_user_id" ON "devices" ("userId");
      CREATE INDEX "idx_devices_device_id" ON "devices" ("deviceId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "devices" CASCADE;
      DROP TABLE IF EXISTS "payments" CASCADE;
      DROP TABLE IF EXISTS "subscriptions" CASCADE;
      DROP TABLE IF EXISTS "subscription_plans" CASCADE;
      DROP TABLE IF EXISTS "sessions" CASCADE;
      DROP TABLE IF EXISTS "wireguard_peers" CASCADE;
      DROP TABLE IF EXISTS "node_metrics" CASCADE;
      DROP TABLE IF EXISTS "vpn_nodes" CASCADE;
      DROP TABLE IF EXISTS "audit_logs" CASCADE;
      DROP TABLE IF EXISTS "users" CASCADE;
    `);
  }
}