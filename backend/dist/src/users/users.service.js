"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const argon2 = require("argon2");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../common/prisma/prisma.service");
const friendships_service_1 = require("../friendships/friendships.service");
let UsersService = class UsersService {
    constructor(prisma, friendships) {
        this.prisma = prisma;
        this.friendships = friendships;
    }
    findByEmail(email) {
        return this.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
    }
    findById(id) {
        return this.prisma.user.findUnique({ where: { id } });
    }
    async createLocalUser(email, passwordHash, displayName) {
        const existing = await this.findByEmail(email);
        if (existing)
            throw new common_1.ConflictException('An account with this email already exists');
        return this.prisma.user.create({
            data: {
                email: email.toLowerCase(),
                passwordHash,
                displayName,
                emailVerifyToken: this.generateToken(),
            },
        });
    }
    async findOrCreateFromSocial(provider, providerId, email, displayName) {
        const identity = await this.prisma.socialIdentity.findUnique({
            where: { provider_providerId: { provider, providerId } },
            include: { user: true },
        });
        if (identity)
            return identity.user;
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
    async linkSocialIdentity(userId, provider, providerId) {
        const existing = await this.prisma.socialIdentity.findUnique({
            where: { provider_providerId: { provider, providerId } },
        });
        if (existing && existing.userId !== userId) {
            throw new common_1.ConflictException('This social account is already linked to another user');
        }
        if (existing)
            return existing;
        return this.prisma.socialIdentity.create({
            data: { provider, providerId, userId },
        });
    }
    generateToken() {
        return (0, crypto_1.randomBytes)(24).toString('hex');
    }
    async verifyEmail(token) {
        const user = await this.prisma.user.findFirst({
            where: { emailVerifyToken: token },
        });
        if (!user)
            throw new common_1.NotFoundException('Invalid or expired verification token');
        return this.prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: true, emailVerifyToken: null },
        });
    }
    async setNewVerificationToken(userId) {
        const token = this.generateToken();
        await this.prisma.user.update({
            where: { id: userId },
            data: { emailVerifyToken: token },
        });
        return token;
    }
    async setPasswordResetToken(userId) {
        const token = this.generateToken();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordResetToken: token, passwordResetExpiresAt: expiresAt },
        });
        return token;
    }
    async resetPassword(token, newPassword) {
        const user = await this.prisma.user.findFirst({
            where: { passwordResetToken: token },
        });
        if (!user ||
            !user.passwordResetExpiresAt ||
            user.passwordResetExpiresAt < new Date()) {
            throw new common_1.NotFoundException('Invalid or expired reset token');
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
    async updateProfile(userId, dto) {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                displayName: dto.displayName ?? undefined,
                publicInfo: dto.publicInfo ?? undefined,
                friendsInfo: dto.friendsInfo ?? undefined,
                privateInfo: dto.privateInfo ?? undefined,
                musicPreferences: dto.musicPreferences ?? undefined,
            },
        });
    }
    async setSubscriptionPlan(userId, plan) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { subscriptionPlan: plan },
        });
    }
    async getProfileForViewer(viewerId, targetId) {
        const target = await this.prisma.user.findUnique({
            where: { id: targetId },
        });
        if (!target)
            throw new common_1.NotFoundException('User not found');
        const base = {
            id: target.id,
            displayName: target.displayName,
            musicPreferences: target.musicPreferences,
            publicInfo: target.publicInfo,
        };
        if (viewerId === targetId) {
            return {
                ...base,
                friendsInfo: target.friendsInfo,
                privateInfo: target.privateInfo,
                isSelf: true,
            };
        }
        const areFriends = await this.friendships.areFriends(viewerId, targetId);
        if (areFriends) {
            return { ...base, friendsInfo: target.friendsInfo, isSelf: false };
        }
        return { ...base, isSelf: false };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        friendships_service_1.FriendshipsService])
], UsersService);
//# sourceMappingURL=users.service.js.map