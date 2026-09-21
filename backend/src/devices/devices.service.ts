import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { RegisterDeviceDto } from './dto/register-device.dto';

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  register(userId: string, dto: RegisterDeviceDto) {
    return this.prisma.device.upsert({
      where: {
        userId_installationId: { userId, installationId: dto.installationId },
      },
      create: {
        userId,
        installationId: dto.installationId,
        platform: dto.platform,
        model: dto.model,
        appVersion: dto.appVersion,
      },
      update: {
        platform: dto.platform,
        model: dto.model,
        appVersion: dto.appVersion,
      },
    });
  }
}
