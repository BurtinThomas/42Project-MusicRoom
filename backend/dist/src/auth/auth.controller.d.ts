import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { GoogleLoginDto, FacebookLoginDto } from './dto/social-login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        message: string;
    }>;
    login(req: any): Promise<import("./auth.service").TokenPair>;
    resendVerification(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    verifyEmail(dto: VerifyEmailDto): Promise<{
        message: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    loginGoogle(dto: GoogleLoginDto): Promise<import("./auth.service").TokenPair>;
    loginFacebook(dto: FacebookLoginDto): Promise<import("./auth.service").TokenPair>;
    linkGoogle(user: AuthenticatedUser, dto: GoogleLoginDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        provider: import(".prisma/client").$Enums.AuthProvider;
        providerId: string;
    }>;
    linkFacebook(user: AuthenticatedUser, dto: FacebookLoginDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        provider: import(".prisma/client").$Enums.AuthProvider;
        providerId: string;
    }>;
    refresh(dto: RefreshTokenDto): Promise<import("./auth.service").TokenPair>;
    logout(dto: RefreshTokenDto): Promise<{
        message: string;
    }>;
}
