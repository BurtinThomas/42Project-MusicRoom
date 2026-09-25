import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuthProvider, Prisma, User } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { FriendshipsService } from '../friendships/friendships.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly friendships: FriendshipsService,
  ) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async createLocalUser(
    email: string,
    passwordHash: string,
    displayName: string,
  ): Promise<User> {
    const existing = await this.findByEmail(email);
    if (existing)
      throw new ConflictException('An account with this email already exists');

    return this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        displayName,
        emailVerifyToken: this.generateToken(),
      },
    });
  }

  async findOrCreateFromSocial(
    provider: AuthProvider,
    providerId: string,
    email: string,
    displayName: string,
  ): Promise<User> {
    const identity = await this.prisma.socialIdentity.findUnique({
      where: { provider_providerId: { provider, providerId } },
      include: { user: true },
    });
    if (identity) return identity.user;

    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      await this.prisma.socialIdentity.create({
        data: { provider, providerId, userId: existingUser.id },
      });
      return existingUser;
    }

    return this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        displayName,
        emailVerified: true,
        identities: { create: { provider, providerId } },
      },
    });
  }

  async linkSocialIdentity(
    userId: string,
    provider: AuthProvider,
    providerId: string,
  ) {
    const existing = await this.prisma.socialIdentity.findUnique({
      where: { provider_providerId: { provider, providerId } },
    });
    if (existing && existing.userId !== userId) {
      throw new ConflictException(
        'This social account is already linked to another user',
      );
    }
    if (existing) return existing;

    return this.prisma.socialIdentity.create({
      data: { provider, providerId, userId },
    });
  }

  generateToken(): string {
    return randomBytes(24).toString('hex');
  }

  async verifyEmail(token: string): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: { emailVerifyToken: token },
    });
    if (!user)
      throw new NotFoundException('Invalid or expired verification token');
    return this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerifyToken: null },
    });
  }

  async setNewVerificationToken(userId: string): Promise<string> {
    const token = this.generateToken();
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifyToken: token },
    });
    return token;
  }

  async setPasswordResetToken(userId: string): Promise<string> {
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordResetToken: token, passwordResetExpiresAt: expiresAt },
    });
    return token;
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { passwordResetToken: token },
    });
    if (
      !user ||
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt < new Date()
    ) {
      throw new NotFoundException('Invalid or expired reset token');
    }
    const passwordHash = await argon2.hash(newPassword);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: dto.displayName ?? undefined,
        publicInfo: (dto.publicInfo as Prisma.InputJsonValue) ?? undefined,
        friendsInfo: (dto.friendsInfo as Prisma.InputJsonValue) ?? undefined,
        privateInfo: (dto.privateInfo as Prisma.InputJsonValue) ?? undefined,
        musicPreferences:
          (dto.musicPreferences as Prisma.InputJsonValue) ?? undefined,
      },
    });
  }

  async getProfileForViewer(viewerId: string, targetId: string) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetId },
    });
    if (!target) throw new NotFoundException('User not found');

    const base = {
      id: target.id,
      displayName: target.displayName,
      musicPreferences: target.musicPreferences,
      publicInfo: target.publicInfo,
    };

    if (viewerId === targetId) {
      const identities = await this.prisma.socialIdentity.findMany({
        where: { userId: targetId },
        select: { provider: true },
      });
      return {
        ...base,
        email: target.email,
        friendsInfo: target.friendsInfo,
        privateInfo: target.privateInfo,
        linkedProviders: identities.map((i) => i.provider),
        isSelf: true,
      };
    }

    const areFriends = await this.friendships.areFriends(viewerId, targetId);
    if (areFriends) {
      return { ...base, friendsInfo: target.friendsInfo, isSelf: false };
    }

    return { ...base, isSelf: false };
  }
}
