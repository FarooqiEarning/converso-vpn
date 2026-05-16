/**
 * Converso VPN - Devices Controller
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateDeviceDto, UpdateDeviceDto } from './dto/device.dto';

@ApiTags('devices')
@Controller('devices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  @ApiOperation({ summary: 'List all user devices' })
  async findAll(@CurrentUser() user: User) {
    return this.devicesService.findAllByUser(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new device' })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateDeviceDto,
  ) {
    return this.devicesService.create(user.id, dto.nodeId, dto.deviceName, dto.deviceType);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get device by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.devicesService.findById(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Rename device' })
  async rename(
    @Param('id') id: string,
    @Body() dto: UpdateDeviceDto,
    @CurrentUser() user: User,
  ) {
    return this.devicesService.rename(id, user.id, dto.deviceName);
  }

  @Patch(':id/node')
  @ApiOperation({ summary: 'Switch device to different node' })
  async switchNode(
    @Param('id') id: string,
    @Body('nodeId') nodeId: string,
    @CurrentUser() user: User,
  ) {
    return this.devicesService.switchNode(id, user.id, nodeId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete/revoke device' })
  async delete(@Param('id') id: string, @CurrentUser() user: User) {
    await this.devicesService.delete(id, user.id);
    return { message: 'Device deleted successfully' };
  }
}