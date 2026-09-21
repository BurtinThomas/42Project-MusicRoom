import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async send(to: string, subject: string, text: string): Promise<void> {
    this.logger.log(`[DEV MAIL] to=${to} subject="${subject}"\n${text}`);
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
