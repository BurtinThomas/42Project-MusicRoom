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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const argon2 = require("argon2");
const crypto_1 = require("crypto");
const google_auth_library_1 = require("google-auth-library");
const axios_1 = require("axios");
const prisma_service_1 = require("../common/prisma/prisma.service");
const mail_service_1 = require("../mail/mail.service");
const users_service_1 = require("../users/users.service");
let AuthService = class AuthService {
    constructor(prisma, users, jwt, config, mail) {
        this.prisma = prisma;
        this.users = users;
        this.jwt = jwt;
        this.config = config;
        this.mail = mail;
        this.googleClient = new google_auth_library_1.OAuth2Client(this.config.get('google.clientId'));
    }
    async register(dto) {
        const passwordHash = await argon2.hash(dto.password);
        const user = await this.users.createLocalUser(dto.email, passwordHash, dto.displayName);
        await this.mail.sendVerificationEmail(user.email, user.emailVerifyToken, this.config.get('appPublicUrl'));
        return {
            message: 'Registered. Please check your email to verify your account.',
        };
    }
    async validateLocalUser(email, password) {
        const user = await this.users.findByEmail(email);
        if (!user || !user.passwordHash) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const valid = await argon2.verify(user.passwordHash, password);
        if (!valid)
            throw new common_1.UnauthorizedException('Invalid credentials');
        if (!user.emailVerified) {
            throw new common_1.ForbiddenException('EMAIL_NOT_VERIFIED');
        }
        return user;
    }
    async resendVerification(email) {
        const user = await this.users.findByEmail(email);
        if (user && !user.emailVerified) {
            const token = await this.users.setNewVerificationToken(user.id);
            await this.mail.sendVerificationEmail(user.email, token, this.config.get('appPublicUrl'));
        }
        return {
            message: 'If this account exists, a verification email has been sent.',
        };
    }
    async verifyEmail(token) {
        await this.users.verifyEmail(token);
        return { message: 'Email verified, you can now log in.' };
    }
    async forgotPassword(email) {
        const user = await this.users.findByEmail(email);
        if (user && user.passwordHash) {
            const token = await this.users.setPasswordResetToken(user.id);
            await this.mail.sendPasswordResetEmail(user.email, token, this.config.get('appPublicUrl'));
        }
        return {
            message: 'If this account exists, a password reset email has been sent.',
        };
    }
    async resetPassword(token, newPassword) {
        await this.users.resetPassword(token, newPassword);
        return { message: 'Password updated, you can now log in.' };
    }
    async loginWithGoogle(idToken) {
        const ticket = await this.googleClient.verifyIdToken({
            idToken,
            audience: this.config.get('google.clientId'),
        });
        const payload = ticket.getPayload();
        if (!payload?.sub || !payload.email) {
            throw new common_1.UnauthorizedException('Invalid Google token');
        }
        return this.users.findOrCreateFromSocial(client_1.AuthProvider.GOOGLE, payload.sub, payload.email, payload.name ?? payload.email.split('@')[0]);
    }
    async loginWithFacebook(accessToken) {
        const appId = this.config.get('facebook.appId');
        const appSecret = this.config.get('facebook.appSecret');
        const debug = await axios_1.default.get('https://graph.facebook.com/debug_token', {
            params: {
                input_token: accessToken,
                access_token: `${appId}|${appSecret}`,
            },
        });
        if (!debug.data?.data?.is_valid || debug.data.data.app_id !== appId) {
            throw new common_1.UnauthorizedException('Invalid Facebook token');
        }
        const profile = await axios_1.default.get('https://graph.facebook.com/me', {
            params: { fields: 'id,name,email', access_token: accessToken },
        });
        const { id: providerId, name, email } = profile.data;
        if (!email) {
            throw new common_1.UnauthorizedException('Your Facebook account has no email associated; email permission is required');
        }
        return this.users.findOrCreateFromSocial(client_1.AuthProvider.FACEBOOK, providerId, email, name);
    }
    async linkGoogle(userId, idToken) {
        const ticket = await this.googleClient.verifyIdToken({
            idToken,
            audience: this.config.get('google.clientId'),
        });
        const payload = ticket.getPayload();
        if (!payload?.sub)
            throw new common_1.UnauthorizedException('Invalid Google token');
        return this.users.linkSocialIdentity(userId, client_1.AuthProvider.GOOGLE, payload.sub);
    }
    async linkFacebook(userId, accessToken) {
        const profile = await axios_1.default.get('https://graph.facebook.com/me', {
            params: { fields: 'id', access_token: accessToken },
        });
        return this.users.linkSocialIdentity(userId, client_1.AuthProvider.FACEBOOK, profile.data.id);
    }
    async issueTokens(user) {
        const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email }, {
            secret: this.config.get('jwt.accessSecret'),
            expiresIn: this.config.get('jwt.accessExpiresIn'),
        });
        const refreshTokenRaw = this.users.generateToken();
        const refreshExpiresIn = this.config.get('jwt.refreshExpiresIn');
        const expiresAt = new Date(Date.now() + this.parseDurationMs(refreshExpiresIn));
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
            expiresIn: this.config.get('jwt.accessExpiresIn'),
        };
    }
    async refresh(refreshTokenRaw) {
        const tokenHash = this.hashToken(refreshTokenRaw);
        const stored = await this.prisma.refreshToken.findUnique({
            where: { tokenHash },
        });
        if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        await this.prisma.refreshToken.update({
            where: { id: stored.id },
            data: { revokedAt: new Date() },
        });
        const user = await this.users.findById(stored.userId);
        if (!user)
            throw new common_1.UnauthorizedException('User not found');
        return this.issueTokens(user);
    }
    async logout(refreshTokenRaw) {
        const tokenHash = this.hashToken(refreshTokenRaw);
        await this.prisma.refreshToken.updateMany({
            where: { tokenHash, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }
    hashToken(raw) {
        return (0, crypto_1.createHash)('sha256').update(raw).digest('hex');
    }
    parseDurationMs(duration) {
        const match = /^(\d+)([smhd])$/.exec(duration);
        if (!match)
            return 30 * 24 * 60 * 60 * 1000;
        const value = parseInt(match[1], 10);
        const unit = match[2];
        const multipliers = {
            s: 1000,
            m: 60000,
            h: 3600000,
            d: 86400000,
        };
        return value * multipliers[unit];
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map