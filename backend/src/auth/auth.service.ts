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
import axios from 'axios';
import { PrismaService } from '../common/prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

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

  async register(dto: RegisterDto): Promise<{ message: string }> {
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

  async resendVerification(email: string): Promise<{ message: string }> {
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

  async verifyEmail(token: string): Promise<{ message: string }> {
    await this.users.verifyEmail(token);
    return { message: 'Email verified, you can now log in.' };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.users.findByEmail(email);
    if (user && user.passwordHash) {
      const token = await this.users.setPasswordResetToken(user.id);
      await this.mail.sendPasswordResetEmail(
        user.email,
        token,
        this.config.get<string>('appPublicUrl')!,
      );
    }
    return {
      message: 'If this account exists, a password reset email has been sent.',
    };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    await this.users.resetPassword(token, newPassword);
    return { message: 'Password updated, you can now log in.' };
  }

  async loginWithGoogle(idToken: string): Promise<User> {
    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: this.config.get<string>('google.clientId'),
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      throw new UnauthorizedException('Invalid Google token');
    }
    return this.users.findOrCreateFromSocial(
      AuthProvider.GOOGLE,
      payload.sub,
      payload.email,
      payload.name ?? payload.email.split('@')[0],
    );
  }

  async loginWithFacebook(accessToken: string): Promise<User> {
    const appId = this.config.get<string>('facebook.appId');
    const appSecret = this.config.get<string>('facebook.appSecret');

    const debug = await axios.get('https://graph.facebook.com/debug_token', {
      params: {
        input_token: accessToken,
        access_token: `${appId}|${appSecret}`,
      },
    });
    if (!debug.data?.data?.is_valid || debug.data.data.app_id !== appId) {
      throw new UnauthorizedException('Invalid Facebook token');
    }

    const profile = await axios.get('https://graph.facebook.com/me', {
      params: { fields: 'id,name,email', access_token: accessToken },
    });
    const { id: providerId, name, email } = profile.data;
    if (!email) {
      throw new UnauthorizedException(
        'Your Facebook account has no email associated; email permission is required',
      );
    }

    return this.users.findOrCreateFromSocial(
      AuthProvider.FACEBOOK,
      providerId,
      email,
      name,
    );
  }

  async linkGoogle(userId: string, idToken: string) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: this.config.get<string>('google.clientId'),
    });
    const payload = ticket.getPayload();
    if (!payload?.sub) throw new UnauthorizedException('Invalid Google token');
    return this.users.linkSocialIdentity(
      userId,
      AuthProvider.GOOGLE,
      payload.sub,
    );
  }

  async linkFacebook(userId: string, accessToken: string) {
    const profile = await axios.get('https://graph.facebook.com/me', {
      params: { fields: 'id', access_token: accessToken },
    });
    return this.users.linkSocialIdentity(
      userId,
      AuthProvider.FACEBOOK,
      profile.data.id,
    );
  }

  async issueTokens(user: User): Promise<TokenPair> {
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

  async refresh(refreshTokenRaw: string): Promise<TokenPair> {
    const tokenHash = this.hashToken(refreshTokenRaw);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

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
