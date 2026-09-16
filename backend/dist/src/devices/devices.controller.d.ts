import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { DevicesService } from './devices.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
export declare class DevicesController {
    private readonly devicesService;
    constructor(devicesService: DevicesService);
    list(user: AuthenticatedUser): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        userId: string;
        installationId: string;
        platform: import(".prisma/client").$Enums.ActionLogPlatform;
        model: string;
        appVersion: string;
        lastSeenAt: Date;
    }[]>;
    register(user: AuthenticatedUser, dto: RegisterDeviceDto): import(".prisma/client").Prisma.Prisma__DeviceClient<{
        id: string;
        createdAt: Date;
        userId: string;
        installationId: string;
        platform: import(".prisma/client").$Enums.ActionLogPlatform;
        model: string;
        appVersion: string;
        lastSeenAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
