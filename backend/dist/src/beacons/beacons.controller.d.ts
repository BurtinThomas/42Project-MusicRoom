import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { BeaconsService } from './beacons.service';
import { ScanBeaconDto, SetEventBeaconDto } from './dto/beacon.dto';
export declare class BeaconsController {
    private readonly beaconsService;
    constructor(beaconsService: BeaconsService);
    setForEvent(user: AuthenticatedUser, eventId: string, dto: SetEventBeaconDto): Promise<{
        id: string;
        eventId: string;
        uuid: string;
        major: number;
        minor: number;
    }>;
    scan(dto: ScanBeaconDto): Promise<{
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
