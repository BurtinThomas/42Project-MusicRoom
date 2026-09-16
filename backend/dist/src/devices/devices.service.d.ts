import { PrismaService } from '../common/prisma/prisma.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
export declare class DevicesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    register(userId: string, dto: RegisterDeviceDto): import(".prisma/client").Prisma.Prisma__DeviceClient<{
        id: string;
        createdAt: Date;
        userId: string;
        installationId: string;
        platform: import(".prisma/client").$Enums.ActionLogPlatform;
        model: string;
        appVersion: string;
        lastSeenAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    listForUser(userId: string): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        userId: string;
        installationId: string;
        platform: import(".prisma/client").$Enums.ActionLogPlatform;
        model: string;
        appVersion: string;
        lastSeenAt: Date;
    }[]>;
}
