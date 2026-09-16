import { PrismaService } from '../common/prisma/prisma.service';
import { AuthProvider, Prisma, SubscriptionPlan, User } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { FriendshipsService } from '../friendships/friendships.service';
export declare class UsersService {
    private readonly prisma;
    private readonly friendships;
    constructor(prisma: PrismaService, friendships: FriendshipsService);
    findByEmail(email: string): Prisma.Prisma__UserClient<{
        id: string;
        email: string;
        passwordHash: string | null;
        emailVerified: boolean;
        emailVerifyToken: string | null;
        passwordResetToken: string | null;
        passwordResetExpiresAt: Date | null;
        displayName: string;
        publicInfo: Prisma.JsonValue;
        friendsInfo: Prisma.JsonValue;
        privateInfo: Prisma.JsonValue;
        musicPreferences: Prisma.JsonValue;
        subscriptionPlan: import(".prisma/client").$Enums.SubscriptionPlan;
        createdAt: Date;
        updatedAt: Date;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    findById(id: string): Prisma.Prisma__UserClient<{
        id: string;
        email: string;
        passwordHash: string | null;
        emailVerified: boolean;
        emailVerifyToken: string | null;
        passwordResetToken: string | null;
        passwordResetExpiresAt: Date | null;
        displayName: string;
        publicInfo: Prisma.JsonValue;
        friendsInfo: Prisma.JsonValue;
        privateInfo: Prisma.JsonValue;
        musicPreferences: Prisma.JsonValue;
        subscriptionPlan: import(".prisma/client").$Enums.SubscriptionPlan;
        createdAt: Date;
        updatedAt: Date;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    createLocalUser(email: string, passwordHash: string, displayName: string): Promise<User>;
    findOrCreateFromSocial(provider: AuthProvider, providerId: string, email: string, displayName: string): Promise<User>;
    linkSocialIdentity(userId: string, provider: AuthProvider, providerId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        provider: import(".prisma/client").$Enums.AuthProvider;
        providerId: string;
    }>;
    generateToken(): string;
    verifyEmail(token: string): Promise<User>;
    setNewVerificationToken(userId: string): Promise<string>;
    setPasswordResetToken(userId: string): Promise<string>;
    resetPassword(token: string, newPassword: string): Promise<void>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<User>;
    setSubscriptionPlan(userId: string, plan: SubscriptionPlan): Promise<User>;
    getProfileForViewer(viewerId: string, targetId: string): Promise<{
        friendsInfo: Prisma.JsonValue;
        privateInfo: Prisma.JsonValue;
        isSelf: boolean;
        id: string;
        displayName: string;
        musicPreferences: Prisma.JsonValue;
        publicInfo: Prisma.JsonValue;
    } | {
        friendsInfo: Prisma.JsonValue;
        isSelf: boolean;
        id: string;
        displayName: string;
        musicPreferences: Prisma.JsonValue;
        publicInfo: Prisma.JsonValue;
    } | {
        isSelf: boolean;
        id: string;
        displayName: string;
        musicPreferences: Prisma.JsonValue;
        publicInfo: Prisma.JsonValue;
    }>;
}
