import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { FriendshipsService } from './friendships.service';
declare class RequestFriendshipDto {
    addresseeId: string;
}
declare class RespondFriendshipDto {
    accept: boolean;
}
export declare class FriendshipsController {
    private readonly friendships;
    constructor(friendships: FriendshipsService);
    list(user: AuthenticatedUser): import(".prisma/client").Prisma.PrismaPromise<({
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
    request(user: AuthenticatedUser, dto: RequestFriendshipDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        requesterId: string;
        addresseeId: string;
        status: import(".prisma/client").$Enums.FriendshipStatus;
    }>;
    respond(user: AuthenticatedUser, id: string, dto: RespondFriendshipDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        requesterId: string;
        addresseeId: string;
        status: import(".prisma/client").$Enums.FriendshipStatus;
    }>;
}
export {};
