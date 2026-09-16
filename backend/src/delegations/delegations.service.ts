import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { GrantDelegationDto } from './dto/grant-delegation.dto';

@Injectable()
export class DelegationsService {
  constructor(private readonly prisma: PrismaService) {}

  async grant(ownerId: string, dto: GrantDelegationDto) {
    const device = await this.prisma.device.findFirst({
      where: { id: dto.deviceId, userId: ownerId },
    });
    if (!device)
      throw new NotFoundException('Device not found on your account');
    if (dto.delegateId === ownerId) {
      throw new ForbiddenException('You already control your own device');
    }

    await this.prisma.controlDelegation.updateMany({
      where: { deviceId: dto.deviceId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return this.prisma.controlDelegation.create({
      data: { ownerId, deviceId: dto.deviceId, delegateId: dto.delegateId },
    });
  }

  async revoke(ownerId: string, delegationId: string) {
    const delegation = await this.prisma.controlDelegation.findFirst({
      where: { id: delegationId, ownerId },
    });
    if (!delegation) throw new NotFoundException('Delegation not found');
    return this.prisma.controlDelegation.update({
      where: { id: delegationId },
      data: { revokedAt: new Date() },
    });
  }

  listForOwner(ownerId: string) {
    return this.prisma.controlDelegation.findMany({
      where: { ownerId },
      include: {
        device: true,
        delegate: { select: { id: true, displayName: true } },
      },
      orderBy: { grantedAt: 'desc' },
    });
  }

  listReceivedBy(delegateId: string) {
    return this.prisma.controlDelegation.findMany({
      where: { delegateId, revokedAt: null },
      include: {
        device: true,
        owner: { select: { id: true, displayName: true } },
      },
    });
  }

  async isDelegateForOwner(
    ownerId: string,
    candidateId: string,
  ): Promise<boolean> {
    const delegation = await this.prisma.controlDelegation.findFirst({
      where: { ownerId, delegateId: candidateId, revokedAt: null },
    });
    return !!delegation;
  }
}
