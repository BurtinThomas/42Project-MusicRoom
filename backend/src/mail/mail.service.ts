import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly devMode: boolean;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.devMode = this.config.get<boolean>('mail.devMode') ?? true;
    this.from = this.config.get<string>('mail.from')!;

    if (!this.devMode) {
      this.transporter = nodemailer.createTransport({
        host: this.config.get<string>('mail.host'),
        port: this.config.get<number>('mail.port'),
        auth: {
          user: this.config.get<string>('mail.user'),
          pass: this.config.get<string>('mail.password'),
        },
      });
    }
  }

  async send(to: string, subject: string, text: string): Promise<void> {
    if (this.devMode || !this.transporter) {
      this.logger.log(`[DEV MAIL] to=${to} subject="${subject}"\n${text}`);
      return;
    }

    await this.transporter.sendMail({ from: this.from, to, subject, text });
  }

  async sendVerificationEmail(
    to: string,
    token: string,
    appPublicUrl: string,
  ): Promise<void> {
    await this.send(
      to,
      'Verify your Music Room account',
      `Welcome to Music Room!\n\nPlease verify your email using this code:\n\n${token}\n\n` +
        `Or open: ${appPublicUrl}/auth/verify-email?token=${token}`,
    );
  }

  async sendPasswordResetEmail(
    to: string,
    token: string,
    appPublicUrl: string,
  ): Promise<void> {
    await this.send(
      to,
      'Reset your Music Room password',
      `You requested a password reset.\n\nUse this code:\n\n${token}\n\n` +
        `Or open: ${appPublicUrl}/auth/reset-password?token=${token}\n\n` +
        `If you did not request this, ignore this email.`,
    );
  }
}
