import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

export async function authenticateSocket(
  client: Socket,
  jwt: JwtService,
  config: ConfigService,
): Promise<void> {
  const token =
    (client.handshake.auth?.token as string) ||
    (client.handshake.query?.token as string);
  try {
    const payload = await jwt.verifyAsync(token, {
      secret: config.get<string>('jwt.accessSecret'),
    });
    client.data.userId = payload.sub;
  } catch {
    client.disconnect(true);
  }
}
