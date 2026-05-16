/**
 * Converso VPN - Users Controller
 */

import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { UpdateUserDto, UpdatePasswordDto } from './dto/user.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser() user: User): Promise<User> {
    return this.usersService.findById(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(user.id, dto);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Delete current user account' })
  async deleteAccount(@CurrentUser() user: User): Promise<{ message: string }> {
    await this.usersService.delete(user.id);
    return { message: 'Account deleted successfully' };
  }

  @Get('me/usage')
  @ApiOperation({ summary: 'Get usage statistics' })
  async getUsage(@CurrentUser() user: User): Promise<{
    totalBandwidth: number;
    activeDevices: number;
    sessionsCount: number;
  }> {
    return this.usersService.getUsageStats(user.id);
  }

  @Patch('me/password')
  @ApiOperation({ summary: 'Update password' })
  async updatePassword(
    @CurrentUser() user: User,
    @Body() dto: UpdatePasswordDto,
  ): Promise<{ message: string }> {
    await this.usersService.updatePassword(user.id, dto);
    return { message: 'Password updated successfully' };
  }
}