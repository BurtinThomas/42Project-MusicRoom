import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;

  constructor(config: ConfigService) {
    const host = config.get<string>('mail.host');
    this.from = config.get<string>('mail.from')!;
    this.transporter = host
      ? createTransport({
          host,
          port: config.get<number>('mail.port'),
          secure: config.get<number>('mail.port') === 465,
          auth: {
            user: config.get<string>('mail.user'),
            pass: config.get<string>('mail.pass'),
          },
        })
      : null;
  }

  async send(to: string, subject: string, text: string): Promise<void> {
    if (!this.transporter) {
      this.logger.log(`[DEV MAIL] to=${to} subject="${subject}"\n${text}`);
      return;
    }
    await this.transporter.sendMail({ from: this.from, to, subject, text });
    this.logger.log(`Mail sent to=${to} subject="${subject}"`);
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

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    await this.send(
      to,
      'Reset your Music Room password',
      `You requested a password reset.\n\nEnter this code in the app ` +
        `(valid for 1 hour):\n\n${token}\n\n` +
        `If you did not request this, ignore this email.`,
    );
  }
}
