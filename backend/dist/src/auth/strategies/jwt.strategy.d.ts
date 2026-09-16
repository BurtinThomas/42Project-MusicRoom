import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
export interface JwtPayload {
    sub: string;
    email: string;
}
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    constructor(config: ConfigService);
    validate(payload: JwtPayload): Promise<AuthenticatedUser>;
}
export {};
