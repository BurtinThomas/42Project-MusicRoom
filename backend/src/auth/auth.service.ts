import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthProvider, User } from '@prisma/client';
import * as argon2 from 'argon2';
import { createHash } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../common/prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { TokenPairDto } from './dto/token-pair.dto';
import { MessageDto } from '../common/dto/message.dto';

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {
    this.googleClient = new OAuth2Client(
      this.config.get<string>('google.clientId'),
    );
  }

  async register(dto: RegisterDto): Promise<MessageDto> {
    const passwordHash = await argon2.hash(dto.password);
    const user = await this.users.createLocalUser(
      dto.email,
      passwordHash,
      dto.displayName,
    );
    await this.mail.sendVerificationEmail(
      user.email,
      user.emailVerifyToken!,
      this.config.get<string>('appPublicUrl')!,
    );
    return {
      message: 'Registered. Please check your email to verify your account.',
    };
  }

  async validateLocalUser(email: string, password: string): Promise<User> {
    const user = await this.users.findByEmail(email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (!user.emailVerified) {
      throw new ForbiddenException('EMAIL_NOT_VERIFIED');
    }
    return user;
  }

  async resendVerification(email: string): Promise<MessageDto> {
    const user = await this.users.findByEmail(email);

    if (user && !user.emailVerified) {
      const token = await this.users.setNewVerificationToken(user.id);
      await this.mail.sendVerificationEmail(
        user.email,
        token,
        this.config.get<string>('appPublicUrl')!,
      );
    }
    return {
      message: 'If this account exists, a verification email has been sent.',
    };
  }

  async verifyEmail(token: string): Promise<MessageDto> {
    await this.users.verifyEmail(token);
    return { message: 'Email verified, you can now log in.' };
  }

  async forgotPassword(email: string): Promise<MessageDto> {
    const user = await this.users.findByEmail(email);
    if (user && user.passwordHash) {
      const token = await this.users.setPasswordResetToken(user.id);
      await this.mail.sendPasswordResetEmail(user.email, token);
    }
    return {
      message: 'If this account exists, a password reset email has been sent.',
    };
  }

  async resetPassword(token: string, newPassword: string): Promise<MessageDto> {
    await this.users.resetPassword(token, newPassword);
    return { message: 'Password updated, you can now log in.' };
  }

  async loginWithGoogle(idToken: string): Promise<User> {
    const payload = await this.verifyGoogleToken(idToken);
    if (!payload.email || !payload.email_verified) {
      throw new UnauthorizedException('Invalid Google token');
    }
    return this.users.findOrCreateFromSocial(
      AuthProvider.GOOGLE,
      payload.sub,
      payload.email,
      payload.name ?? payload.email.split('@')[0],
    );
  }

  async linkGoogle(userId: string, idToken: string): Promise<MessageDto> {
    const payload = await this.verifyGoogleToken(idToken);
    await this.users.linkSocialIdentity(
      userId,
      AuthProvider.GOOGLE,
      payload.sub,
    );
    return { message: 'Google account linked' };
  }

  private async verifyGoogleToken(idToken: string) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: this.config.get<string>('google.clientId'),
    });
    const payload = ticket.getPayload();
    if (!payload?.sub) throw new UnauthorizedException('Invalid Google token');
    return { ...payload, sub: payload.sub };
  }

  async issueTokens(user: User): Promise<TokenPairDto> {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email },
      {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: this.config.get<string>('jwt.accessExpiresIn'),
      },
    );

    const refreshTokenRaw = this.users.generateToken();
    const refreshExpiresIn = this.config.get<string>('jwt.refreshExpiresIn')!;
    const expiresAt = new Date(
      Date.now() + this.parseDurationMs(refreshExpiresIn),
    );

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: this.hashToken(refreshTokenRaw),
        userId: user.id,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenRaw,
      expiresIn: this.config.get<string>('jwt.accessExpiresIn')!,
    };
  }

  async refresh(refreshTokenRaw: string): Promise<TokenPairDto> {
    const tokenHash = this.hashToken(refreshTokenRaw);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const { count } = await this.prisma.refreshToken.updateMany({
      where: { id: stored.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (count === 0) throw new UnauthorizedException('Invalid refresh token');

    const user = await this.users.findById(stored.userId);
    if (!user) throw new UnauthorizedException('User not found');
    return this.issueTokens(user);
  }

  async logout(refreshTokenRaw: string): Promise<void> {
    const tokenHash = this.hashToken(refreshTokenRaw);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  private parseDurationMs(duration: string): number {
    const match = /^(\d+)([smhd])$/.exec(duration);
    if (!match) return 30 * 24 * 60 * 60 * 1000;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60000,
      h: 3600000,
      d: 86400000,
    };
    return value * multipliers[unit];
  }
}
