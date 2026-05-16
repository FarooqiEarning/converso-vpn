/**
 * Converso VPN - Auth Service
 */

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from '../users/entities/user.entity';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  GoogleAuthDto,
} from './dto/auth.dto';
import { TokenResponse } from './dto/auth.response';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<TokenResponse> {
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = this.userRepository.create({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      status: UserStatus.ACTIVE,
    });

    await this.userRepository.save(user);

    return this.generateTokens(user);
  }

  async login(dto: LoginDto): Promise<TokenResponse> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    user.lastLoginAt = new Date();
    user.lastLoginIp = dto.ip;
    await this.userRepository.save(user);

    return this.generateTokens(user);
  }

  async refreshToken(dto: RefreshTokenDto): Promise<TokenResponse> {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.get('jwt.refreshSecret'),
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub, status: UserStatus.ACTIVE },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async googleAuth(dto: GoogleAuthDto): Promise<TokenResponse> {
    const { googleId, email, fullName, avatarUrl } = dto;

    let user = await this.userRepository.findOne({
      where: { googleId },
    });

    if (!user && email) {
      user = await this.userRepository.findOne({
        where: { email },
      });

      if (user) {
        user.googleId = googleId;
        user.avatarUrl = avatarUrl || user.avatarUrl;
        await this.userRepository.save(user);
      }
    }

    if (!user) {
      user = this.userRepository.create({
        email,
        googleId,
        fullName: fullName || email.split('@')[0],
        avatarUrl,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      });
      await this.userRepository.save(user);
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    return this.generateTokens(user);
  }

  async validateGoogleToken(token: string): Promise<{ googleId: string; email: string; name: string; avatarUrl: string }> {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`,
    );

    if (!response.ok) {
      throw new BadRequestException('Invalid Google token');
    }

    const data = await response.json();
    return {
      googleId: data.sub,
      email: data.email,
      name: data.name,
      avatarUrl: data.picture,
    };
  }

  async logout(userId: string): Promise<void> {
    this.logger.log(`User ${userId} logged out`);
  }

  private generateTokens(user: User): TokenResponse {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.accessSecret'),
      expiresIn: this.configService.get('jwt.accessExpiresIn', '15m'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.refreshSecret'),
      expiresIn: this.configService.get('jwt.refreshExpiresIn', '30d'),
    });

    return { accessToken, refreshToken };
  }

  async findUserById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }
}