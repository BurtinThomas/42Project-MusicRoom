import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';

describe('AuthService.validateLocalUser', () => {
  function makeService(usersOverrides: any) {
    const config = { get: jest.fn().mockReturnValue('test-google-client-id') };
    const users = usersOverrides;
    const service = new AuthService(
      {} as any,
      users as any,
      {} as any,
      config as any,
      {} as any,
    );
    return service;
  }

  it('rejects a wrong password', async () => {
    const passwordHash = await argon2.hash('correct-password');
    const service = makeService({
      findByEmail: jest.fn().mockResolvedValue({
        email: 'a@a.com',
        passwordHash,
        emailVerified: true,
      }),
    });

    await expect(
      service.validateLocalUser('a@a.com', 'wrong-password'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('blocks login while the email is not verified', async () => {
    const passwordHash = await argon2.hash('correct-password');
    const service = makeService({
      findByEmail: jest.fn().mockResolvedValue({
        email: 'a@a.com',
        passwordHash,
        emailVerified: false,
      }),
    });

    await expect(
      service.validateLocalUser('a@a.com', 'correct-password'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('logs in with the right password once the email is verified', async () => {
    const passwordHash = await argon2.hash('correct-password');
    const user = { email: 'a@a.com', passwordHash, emailVerified: true };
    const service = makeService({
      findByEmail: jest.fn().mockResolvedValue(user),
    });

    await expect(
      service.validateLocalUser('a@a.com', 'correct-password'),
    ).resolves.toEqual(user);
  });
});
