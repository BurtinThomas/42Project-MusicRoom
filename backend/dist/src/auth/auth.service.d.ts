import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
}
export declare class AuthService {
    private readonly prisma;
    private readonly users;
    private readonly jwt;
    private readonly config;
    private readonly mail;
    private readonly googleClient;
    constructor(prisma: PrismaService, users: UsersService, jwt: JwtService, config: ConfigService, mail: MailService);
    register(dto: RegisterDto): Promise<{
        message: string;
    }>;
    validateLocalUser(email: string, password: string): Promise<User>;
    resendVerification(email: string): Promise<{
        message: string;
    }>;
    verifyEmail(token: string): Promise<{
        message: string;
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
    loginWithGoogle(idToken: string): Promise<User>;
    loginWithFacebook(accessToken: string): Promise<User>;
    linkGoogle(userId: string, idToken: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        provider: import(".prisma/client").$Enums.AuthProvider;
        providerId: string;
    }>;
    linkFacebook(userId: string, accessToken: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        provider: import(".prisma/client").$Enums.AuthProvider;
        providerId: string;
    }>;
    issueTokens(user: User): Promise<TokenPair>;
    refresh(refreshTokenRaw: string): Promise<TokenPair>;
    logout(refreshTokenRaw: string): Promise<void>;
    private hashToken;
    private parseDurationMs;
}
