import { ConfigService } from '@nestjs/config';
export declare class MailService {
    private readonly config;
    private readonly logger;
    private transporter;
    private readonly devMode;
    private readonly from;
    constructor(config: ConfigService);
    send(to: string, subject: string, text: string): Promise<void>;
    sendVerificationEmail(to: string, token: string, appPublicUrl: string): Promise<void>;
    sendPasswordResetEmail(to: string, token: string, appPublicUrl: string): Promise<void>;
}
