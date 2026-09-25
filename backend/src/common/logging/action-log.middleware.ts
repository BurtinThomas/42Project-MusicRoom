import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import type { ClientPlatform } from '../interfaces/client-context.interface';

@Injectable()
export class ActionLogMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    if (req.method !== 'OPTIONS') {
      res.on('finish', () => this.record(req, res.statusCode));
    }
    next();
  }

  private record(req: Request, status: number): void {
    const { user } = req as Request & { user?: AuthenticatedUser };
    const rawPlatform = String(
      req.headers['x-client-platform'] ?? '',
    ).toUpperCase();
    const platform: ClientPlatform = ['ANDROID', 'WEB'].includes(rawPlatform)
      ? (rawPlatform as ClientPlatform)
      : 'UNKNOWN';
    const device = String(req.headers['x-client-device'] ?? 'unknown');
    const appVersion = String(req.headers['x-client-app-version'] ?? 'unknown');
    const route = req.route?.path ?? req.originalUrl.split('?')[0];

    this.prisma.actionLog
      .create({
        data: {
          userId: user?.id,
          platform,
          device,
          appVersion,
          action: `${req.method} ${route}`,
          metadata: {
            outcome: status < 400 ? 'success' : 'error',
            status,
            params: req.params,
            query: req.query as Record<string, string>,
            ...(route === '/auth/login' && status >= 400
              ? { attemptedEmail: req.body?.email }
              : {}),
          },
        },
      })
      .catch(() => {});
  }
}
