import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import type { ClientPlatform } from '../interfaces/client-context.interface';

@Injectable()
export class ActionLogInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const route = request.route?.path ?? request.url;

    return next.handle().pipe(
      tap({
        next: () => this.record(request, method, route, 'success'),
        error: () => this.record(request, method, route, 'error'),
      }),
    );
  }

  private record(request: any, method: string, route: string, outcome: string) {
    const user = request.user as AuthenticatedUser | undefined;
    const headers = request.headers ?? {};
    const rawPlatform = String(
      headers['x-client-platform'] ?? '',
    ).toUpperCase();
    const platform: ClientPlatform = ['ANDROID', 'WEB'].includes(rawPlatform)
      ? (rawPlatform as ClientPlatform)
      : 'UNKNOWN';
    const appVersion = String(headers['x-client-app-version'] ?? 'unknown');
    const deviceModel = String(headers['x-client-device'] ?? 'unknown');
    const installationId = headers['x-client-installation-id'];

    const run = async () => {
      let deviceId: string | undefined;
      if (user?.id && installationId) {
        const device = await this.prisma.device.findUnique({
          where: {
            userId_installationId: {
              userId: user.id,
              installationId: String(installationId),
            },
          },
          select: { id: true },
        });
        deviceId = device?.id;
      }

      await this.prisma.actionLog.create({
        data: {
          userId: user?.id,
          deviceId,
          platform,
          appVersion,
          action: `${method} ${route}`,
          metadata: {
            outcome,
            deviceModel,
            params: request.params,
            query: request.query,
          },
        },
      });
    };

    run().catch(() => {});
  }
}
