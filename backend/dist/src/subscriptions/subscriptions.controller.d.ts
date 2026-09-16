import { SubscriptionPlan } from '@prisma/client';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { UsersService } from '../users/users.service';
declare class ChangePlanDto {
    plan: SubscriptionPlan;
}
export declare class SubscriptionsController {
    private readonly usersService;
    constructor(usersService: UsersService);
    me(user: AuthenticatedUser): Promise<{
        plan: import(".prisma/client").$Enums.SubscriptionPlan | undefined;
    }>;
    change(user: AuthenticatedUser, dto: ChangePlanDto): Promise<{
        plan: import(".prisma/client").$Enums.SubscriptionPlan;
    }>;
}
export {};
