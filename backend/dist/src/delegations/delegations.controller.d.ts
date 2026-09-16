import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { DelegationsService } from './delegations.service';
import { GrantDelegationDto } from './dto/grant-delegation.dto';
export declare class DelegationsController {
    private readonly delegationsService;
    constructor(delegationsService: DelegationsService);
    listGranted(user: AuthenticatedUser): import(".prisma/client").Prisma.PrismaPromise<({
        device: {
            id: string;
            createdAt: Date;
            userId: string;
            installationId: string;
            platform: import(".prisma/client").$Enums.ActionLogPlatform;
            model: string;
            appVersion: string;
            lastSeenAt: Date;
        };
        delegate: {
            id: string;
            displayName: string;
        };
    } & {
        id: string;
        ownerId: string;
        deviceId: string;
        revokedAt: Date | null;
        delegateId: string;
        grantedAt: Date;
    })[]>;
    listReceived(user: AuthenticatedUser): import(".prisma/client").Prisma.PrismaPromise<({
        owner: {
            id: string;
            displayName: string;
        };
        device: {
            id: string;
            createdAt: Date;
            userId: string;
            installationId: string;
            platform: import(".prisma/client").$Enums.ActionLogPlatform;
            model: string;
            appVersion: string;
            lastSeenAt: Date;
        };
    } & {
        id: string;
        ownerId: string;
        deviceId: string;
        revokedAt: Date | null;
        delegateId: string;
        grantedAt: Date;
    })[]>;
    grant(user: AuthenticatedUser, dto: GrantDelegationDto): Promise<{
        id: string;
        ownerId: string;
        deviceId: string;
        revokedAt: Date | null;
        delegateId: string;
        grantedAt: Date;
    }>;
    revoke(user: AuthenticatedUser, id: string): Promise<{
        id: string;
        ownerId: string;
        deviceId: string;
        revokedAt: Date | null;
        delegateId: string;
        grantedAt: Date;
    }>;
}
