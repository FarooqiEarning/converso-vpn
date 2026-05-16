/**
 * Converso VPN - WireGuard Service
 * Key generation, config generation, QR code, peer management
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import * as QRCode from 'qrcode';
import { WireGuardPeer, PeerStatus } from './entities/wireguard-peer.entity';
import { VpnNode } from '../vpn-nodes/entities/vpn-node.entity';

export interface WireGuardConfig {
  privateKey: string;
  address: string;
  dns: string[];
  allowedIPs: string[];
  peer: {
    publicKey: string;
    presharedKey?: string;
    endpoint: string;
    allowedIPs: string[];
    persistentKeepalive: number;
  };
}

@Injectable()
export class WireGuardService {
  private readonly encryptionKey: Buffer;

  constructor(
    @InjectRepository(WireGuardPeer)
    private readonly peerRepository: Repository<WireGuardPeer>,
    @InjectRepository(VpnNode)
    private readonly nodeRepository: Repository<VpnNode>,
    private readonly configService: ConfigService,
  ) {
    const key = this.configService.get<string>('encryption.key');
    this.encryptionKey = Buffer.from(key?.slice(0, 32) || '', 'utf-8');
  }

  generateKeyPair(): { privateKey: string; publicKey: string } {
    const privateKeyBytes = randomBytes(32);
    const publicKeyBytes = this.generateCurve25519PublicKey(privateKeyBytes);

    return {
      privateKey: this.base64UrlEncode(privateKeyBytes),
      publicKey: this.base64UrlEncode(publicKeyBytes),
    };
  }

  private generateCurve25519PublicKey(privateKey: Uint8Array): Uint8Array {
    const publicKey = Buffer.alloc(32);
    const crypto = require('crypto');
    const dh = crypto.createDiffieHellman(256);
    dh.setPrivateKey(Buffer.from(privateKey));
    const generated = dh.getPublicKey();
    generated.copy(publicKey, 0, generated.length - 32, generated.length);
    return publicKey;
  }

  private base64UrlEncode(buffer: Uint8Array): string {
    return Buffer.from(buffer).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  encryptPrivateKey(privateKey: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(privateKey, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
  }

  decryptPrivateKey(encrypted: string): string {
    const [ivB64, authTagB64, dataB64] = encrypted.split(':');
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    const encryptedData = Buffer.from(dataB64, 'base64');
    const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(encryptedData) + decipher.final('utf8');
  }

  async allocateIp(nodeId: string): Promise<string> {
    const node = await this.nodeRepository.findOne({ where: { id: nodeId } });
    if (!node) {
      throw new BadRequestException('Node not found');
    }

    const usedIps = await this.peerRepository
      .createQueryBuilder('peer')
      .select('peer.assignedIp')
      .where('peer.nodeId = :nodeId', { nodeId })
      .getRawMany();

    const usedIpSet = new Set(usedIps.map((p: { assignedIp: string }) => p.assignedIp));

    const baseIp = node.metadata?.subnet || '10.0.0';
    for (let i = 2; i < 254; i++) {
      const ip = `${baseIp}.${i}`;
      if (!usedIpSet.has(ip)) {
        return ip;
      }
    }

    throw new BadRequestException('No available IPs on this node');
  }

  async generateConfig(peerId: string): Promise<WireGuardConfig> {
    const peer = await this.peerRepository.findOne({
      where: { id: peerId },
      relations: ['node'],
    });

    if (!peer || peer.status !== PeerStatus.ACTIVE) {
      throw new BadRequestException('Peer not found or inactive');
    }

    const privateKey = this.decryptPrivateKey(peer.privateKeyEncrypted);
    const dns = this.configService.get<string[]>('wireguard.dns', ['1.1.1.1', '1.0.0.1']);
    const keepalive = this.configService.get<number>('wireguard.keepalive', 25);

    return {
      privateKey,
      address: peer.assignedIp,
      dns,
      allowedIPs: ['0.0.0.0/0', '::/0'],
      peer: {
        publicKey: peer.node.publicKey,
        presharedKey: peer.presharedKeyEncrypted || undefined,
        endpoint: peer.node.endpoint,
        allowedIPs: ['0.0.0.0/0', '::/0'],
        persistentKeepalive: keepalive,
      },
    };
  }

  generateConfigFile(config: WireGuardConfig): string {
    const lines = [
      '[Interface]',
      `PrivateKey = ${config.privateKey}`,
      `Address = ${config.address}`,
      `DNS = ${config.dns.join(', ')}`,
      '',
      '[Peer]',
      `PublicKey = ${config.peer.publicKey}`,
      `Endpoint = ${config.peer.endpoint}`,
      `AllowedIPs = ${config.peer.allowedIPs.join(', ')}`,
    ];

    if (config.peer.presharedKey) {
      lines.splice(4, 0, `PresharedKey = ${config.peer.presharedKey}`);
    }

    if (config.peer.persistentKeepalive > 0) {
      lines.push(`PersistentKeepalive = ${config.peer.persistentKeepalive}`);
    }

    return lines.join('\n');
  }

  async generateQRCode(peerId: string): Promise<Buffer> {
    const config = await this.generateConfig(peerId);
    const configStr = this.generateConfigFile(config);
    return QRCode.toBuffer(configStr, { errorCorrectionLevel: 'M' });
  }

  async createPeer(
    userId: string,
    nodeId: string,
    deviceName: string,
    deviceType?: string,
  ): Promise<WireGuardPeer> {
    const keys = this.generateKeyPair();
    const allocatedIp = await this.allocateIp(nodeId);

    const peer = this.peerRepository.create({
      userId,
      nodeId,
      deviceName,
      deviceType: deviceType as any,
      publicKey: keys.publicKey,
      privateKeyEncrypted: this.encryptPrivateKey(keys.privateKey),
      assignedIp: allocatedIp,
      status: PeerStatus.ACTIVE,
    });

    return this.peerRepository.save(peer);
  }

  async revokePeer(peerId: string): Promise<void> {
    const peer = await this.peerRepository.findOne({ where: { id: peerId } });
    if (peer) {
      peer.status = PeerStatus.REVOKED;
      await this.peerRepository.save(peer);
    }
  }
}