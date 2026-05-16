/**
 * Converso VPN - Devices Service
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WireGuardPeer, PeerStatus } from '../wireguard/entities/wireguard-peer.entity';
import { VpnNode } from '../vpn-nodes/entities/vpn-node.entity';
import { WireGuardService } from '../wireguard/wireguard.service';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(WireGuardPeer)
    private readonly peerRepository: Repository<WireGuardPeer>,
    @InjectRepository(VpnNode)
    private readonly nodeRepository: Repository<VpnNode>,
    private readonly wireGuardService: WireGuardService,
  ) {}

  async findAllByUser(userId: string): Promise<WireGuardPeer[]> {
    return this.peerRepository.find({
      where: { userId },
      relations: ['node'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(peerId: string, userId: string): Promise<WireGuardPeer> {
    const peer = await this.peerRepository.findOne({
      where: { id: peerId, userId },
      relations: ['node'],
    });

    if (!peer) {
      throw new NotFoundException('Device not found');
    }

    return peer;
  }

  async create(
    userId: string,
    nodeId: string,
    deviceName: string,
    deviceType?: string,
  ): Promise<WireGuardPeer> {
    const node = await this.nodeRepository.findOne({ where: { id: nodeId } });
    if (!node) {
      throw new NotFoundException('Node not found');
    }

    const existingDevices = await this.peerRepository.count({
      where: { userId, status: PeerStatus.ACTIVE },
    });

    if (existingDevices >= 10) {
      throw new BadRequestException('Maximum device limit reached');
    }

    return this.wireGuardService.createPeer(userId, nodeId, deviceName, deviceType);
  }

  async rename(peerId: string, userId: string, deviceName: string): Promise<WireGuardPeer> {
    const peer = await this.findById(peerId, userId);
    peer.deviceName = deviceName;
    return this.peerRepository.save(peer);
  }

  async switchNode(peerId: string, userId: string, newNodeId: string): Promise<WireGuardPeer> {
    const peer = await this.findById(peerId, userId);
    const newNode = await this.nodeRepository.findOne({ where: { id: newNodeId } });

    if (!newNode) {
      throw new NotFoundException('Target node not found');
    }

    const newPeer = await this.wireGuardService.createPeer(
      peer.userId,
      newNodeId,
      peer.deviceName,
      peer.deviceType || undefined,
    );

    await this.wireGuardService.revokePeer(peerId);

    return newPeer;
  }

  async delete(peerId: string, userId: string): Promise<void> {
    await this.findById(peerId, userId);
    await this.wireGuardService.revokePeer(peerId);
  }
}