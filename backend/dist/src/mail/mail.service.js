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
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = require("nodemailer");
let MailService = MailService_1 = class MailService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(MailService_1.name);
        this.transporter = null;
        this.devMode = this.config.get('mail.devMode') ?? true;
        this.from = this.config.get('mail.from');
        if (!this.devMode) {
            this.transporter = nodemailer.createTransport({
                host: this.config.get('mail.host'),
                port: this.config.get('mail.port'),
                auth: {
                    user: this.config.get('mail.user'),
                    pass: this.config.get('mail.password'),
                },
            });
        }
    }
    async send(to, subject, text) {
        if (this.devMode || !this.transporter) {
            this.logger.log(`[DEV MAIL] to=${to} subject="${subject}"\n${text}`);
            return;
        }
        await this.transporter.sendMail({ from: this.from, to, subject, text });
    }
    async sendVerificationEmail(to, token, appPublicUrl) {
        await this.send(to, 'Verify your Music Room account', `Welcome to Music Room!\n\nPlease verify your email using this code:\n\n${token}\n\n` +
            `Or open: ${appPublicUrl}/auth/verify-email?token=${token}`);
    }
    async sendPasswordResetEmail(to, token, appPublicUrl) {
        await this.send(to, 'Reset your Music Room password', `You requested a password reset.\n\nUse this code:\n\n${token}\n\n` +
            `Or open: ${appPublicUrl}/auth/reset-password?token=${token}\n\n` +
            `If you did not request this, ignore this email.`);
    }
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailService);
//# sourceMappingURL=mail.service.js.map