import { PrismaService } from '../common/prisma/prisma.service';
import { GrantDelegationDto } from './dto/grant-delegation.dto';
export declare class DelegationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    grant(ownerId: string, dto: GrantDelegationDto): Promise<{
        id: string;
        ownerId: string;
        deviceId: string;
        revokedAt: Date | null;
        delegateId: string;
        grantedAt: Date;
    }>;
    revoke(ownerId: string, delegationId: string): Promise<{
        id: string;
        ownerId: string;
        deviceId: string;
        revokedAt: Date | null;
        delegateId: string;
        grantedAt: Date;
    }>;
    listForOwner(ownerId: string): import(".prisma/client").Prisma.PrismaPromise<({
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
    listReceivedBy(delegateId: string): import(".prisma/client").Prisma.PrismaPromise<({
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
    isDelegateForOwner(ownerId: string, candidateId: string): Promise<boolean>;
}
