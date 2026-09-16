import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
declare const LocalStrategy_base: new (...args: any[]) => Strategy;
export declare class LocalStrategy extends LocalStrategy_base {
    private readonly authService;
    constructor(authService: AuthService);
    validate(email: string, password: string): Promise<{
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
    }>;
}
export {};
