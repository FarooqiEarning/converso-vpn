/**
 * Converso VPN - Device DTOs
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateDeviceDto {
  @ApiProperty()
  @IsUUID()
  nodeId: string;

  @ApiProperty({ example: 'iPhone 15 Pro' })
  @IsString()
  deviceName: string;

  @ApiPropertyOptional({ example: 'ios' })
  @IsOptional()
  @IsString()
  deviceType?: string;
}

export class UpdateDeviceDto {
  @ApiProperty({ example: 'New Device Name' })
  @IsString()
  deviceName: string;
}