import { PrismaService } from '../common/prisma/prisma.service';
import { SetEventBeaconDto } from './dto/beacon.dto';
export declare class BeaconsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    setForEvent(ownerId: string, eventId: string, dto: SetEventBeaconDto): Promise<{
        id: string;
        eventId: string;
        uuid: string;
        major: number;
        minor: number;
    }>;
    scan(uuid: string, major: number, minor: number): Promise<{
        eventId: string;
        name: string;
        currentTopTrack: {
            id: string;
            title: string;
            artist: string;
            durationMs: number | null;
            externalRef: string | null;
        };
    }>;
}
