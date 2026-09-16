import { Visibility, VoteLicense } from '@prisma/client';
export declare class CreateEventDto {
    name: string;
    visibility?: Visibility;
    voteLicense?: VoteLicense;
    locationLat?: number;
    locationLng?: number;
    locationRadiusM?: number;
    voteWindowStart?: string;
    voteWindowEnd?: string;
}
