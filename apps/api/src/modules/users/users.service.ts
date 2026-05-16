/**
 * Converso VPN - Users Service
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from './entities/user.entity';
import { UpdateUserDto, UpdatePasswordDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    if (dto.fullName) {
      user.fullName = dto.fullName;
    }
    if (dto.avatarUrl !== undefined) {
      user.avatarUrl = dto.avatarUrl;
    }

    return this.userRepository.save(user);
  }

  async updatePassword(id: string, dto: UpdatePasswordDto): Promise<void> {
    const user = await this.findById(id);

    if (user.passwordHash) {
      const isCurrentValid = await bcrypt.compare(
        dto.currentPassword,
        user.passwordHash,
      );
      if (!isCurrentValid) {
        throw new ConflictException('Current password is incorrect');
      }
    }

    user.passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.userRepository.save(user);
  }

  async delete(id: string): Promise<void> {
    const user = await this.findById(id);
    user.status = UserStatus.DELETED;
    user.email = `deleted_${user.id}@converso.invalid`;
    await this.userRepository.save(user);
  }

  async getUsageStats(userId: string): Promise<{
    totalBandwidth: number;
    activeDevices: number;
    sessionsCount: number;
  }> {
    const peerRepo = this.userRepository.manager.getRepository('wireguard_peers');
    const sessionRepo = this.userRepository.manager.getRepository('sessions');

    const peers = await peerRepo.find({
      where: { userId, status: 'active' as any },
    });
    const sessions = await sessionRepo.count({ where: { userId } });

    const totalBandwidth = peers.reduce(
      (sum, peer) => sum + Number(peer.bytesSent) + Number(peer.bytesReceived),
      0,
    );

    return {
      totalBandwidth,
      activeDevices: peers.length,
      sessionsCount: sessions,
    };
  }
}