import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    me(user: AuthenticatedUser): Promise<{
        friendsInfo: import("@prisma/client/runtime/library").JsonValue;
        privateInfo: import("@prisma/client/runtime/library").JsonValue;
        isSelf: boolean;
        id: string;
        displayName: string;
        musicPreferences: import("@prisma/client/runtime/library").JsonValue;
        publicInfo: import("@prisma/client/runtime/library").JsonValue;
    } | {
        friendsInfo: import("@prisma/client/runtime/library").JsonValue;
        isSelf: boolean;
        id: string;
        displayName: string;
        musicPreferences: import("@prisma/client/runtime/library").JsonValue;
        publicInfo: import("@prisma/client/runtime/library").JsonValue;
    } | {
        isSelf: boolean;
        id: string;
        displayName: string;
        musicPreferences: import("@prisma/client/runtime/library").JsonValue;
        publicInfo: import("@prisma/client/runtime/library").JsonValue;
    }>;
    updateMe(user: AuthenticatedUser, dto: UpdateProfileDto): Promise<{
        friendsInfo: import("@prisma/client/runtime/library").JsonValue;
        privateInfo: import("@prisma/client/runtime/library").JsonValue;
        isSelf: boolean;
        id: string;
        displayName: string;
        musicPreferences: import("@prisma/client/runtime/library").JsonValue;
        publicInfo: import("@prisma/client/runtime/library").JsonValue;
    } | {
        friendsInfo: import("@prisma/client/runtime/library").JsonValue;
        isSelf: boolean;
        id: string;
        displayName: string;
        musicPreferences: import("@prisma/client/runtime/library").JsonValue;
        publicInfo: import("@prisma/client/runtime/library").JsonValue;
    } | {
        isSelf: boolean;
        id: string;
        displayName: string;
        musicPreferences: import("@prisma/client/runtime/library").JsonValue;
        publicInfo: import("@prisma/client/runtime/library").JsonValue;
    }>;
    get(user: AuthenticatedUser, id: string): Promise<{
        friendsInfo: import("@prisma/client/runtime/library").JsonValue;
        privateInfo: import("@prisma/client/runtime/library").JsonValue;
        isSelf: boolean;
        id: string;
        displayName: string;
        musicPreferences: import("@prisma/client/runtime/library").JsonValue;
        publicInfo: import("@prisma/client/runtime/library").JsonValue;
    } | {
        friendsInfo: import("@prisma/client/runtime/library").JsonValue;
        isSelf: boolean;
        id: string;
        displayName: string;
        musicPreferences: import("@prisma/client/runtime/library").JsonValue;
        publicInfo: import("@prisma/client/runtime/library").JsonValue;
    } | {
        isSelf: boolean;
        id: string;
        displayName: string;
        musicPreferences: import("@prisma/client/runtime/library").JsonValue;
        publicInfo: import("@prisma/client/runtime/library").JsonValue;
    }>;
}
