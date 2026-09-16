import { PrismaService } from '../common/prisma/prisma.service';
export declare class FriendshipsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    areFriends(userIdA: string, userIdB: string): Promise<boolean>;
    request(requesterId: string, addresseeId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        requesterId: string;
        addresseeId: string;
        status: import(".prisma/client").$Enums.FriendshipStatus;
    }>;
    respond(userId: string, friendshipId: string, accept: boolean): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        requesterId: string;
        addresseeId: string;
        status: import(".prisma/client").$Enums.FriendshipStatus;
    }>;
    listFor(userId: string): import(".prisma/client").Prisma.PrismaPromise<({
        requester: {
            id: string;
            email: string;
            passwordHash: string | null;
            emailVerified: boolean;
            emailVerifyToken: string | null;
            passwordResetToken: string | null;
            passwordResetExpiresAt: Date | null;
            displayName: string;
            publicInfo: import("@prisma/client/runtime/library").JsonValue;
            friendsInfo: import("@prisma/client/runtime/library").JsonValue;
            privateInfo: import("@prisma/client/runtime/library").JsonValue;
            musicPreferences: import("@prisma/client/runtime/library").JsonValue;
            subscriptionPlan: import(".prisma/client").$Enums.SubscriptionPlan;
            createdAt: Date;
            updatedAt: Date;
        };
        addressee: {
            id: string;
            email: string;
            passwordHash: string | null;
            emailVerified: boolean;
            emailVerifyToken: string | null;
            passwordResetToken: string | null;
            passwordResetExpiresAt: Date | null;
            displayName: string;
            publicInfo: import("@prisma/client/runtime/library").JsonValue;
            friendsInfo: import("@prisma/client/runtime/library").JsonValue;
            privateInfo: import("@prisma/client/runtime/library").JsonValue;
            musicPreferences: import("@prisma/client/runtime/library").JsonValue;
            subscriptionPlan: import(".prisma/client").$Enums.SubscriptionPlan;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        requesterId: string;
        addresseeId: string;
        status: import(".prisma/client").$Enums.FriendshipStatus;
    })[]>;
}
