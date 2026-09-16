import { EditLicense, Visibility } from '@prisma/client';
export declare class CreatePlaylistDto {
    name: string;
    visibility?: Visibility;
    editLicense?: EditLicense;
}
