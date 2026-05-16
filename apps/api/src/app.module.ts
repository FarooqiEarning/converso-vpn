/**
 * Converso VPN - Root Application Module
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { VpnNodesModule } from './modules/vpn-nodes/vpn-nodes.module';
import { WireGuardModule } from './modules/wireguard/wireguard.module';
import { DevicesModule } from './modules/devices/devices.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { BillingModule } from './modules/billing/billing.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: require('./config/validation.schema'),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get<number>('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USERNAME', 'converso_user'),
        password: configService.get('DATABASE_PASSWORD', ''),
        database: configService.get('DATABASE_NAME', 'converso_vpn'),
        entities: [__dirname + '/modules/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
        ssl: configService.get('DATABASE_SSL', false)
          ? { rejectUnauthorized: false }
          : false,
        extra: {
          min: configService.get<number>('DATABASE_POOL_MIN', 5),
          max: configService.get<number>('DATABASE_POOL_MAX', 30),
        },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    VpnNodesModule,
    WireGuardModule,
    DevicesModule,
    SubscriptionsModule,
    BillingModule,
    AnalyticsModule,
    NotificationsModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestIdInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
  exports: [TypeOrmModule],
})
export class AppModule {}