export declare const SYNC_ACTION_TYPES: readonly ["event.suggestTrack", "event.vote", "event.unvote", "event.advance", "playlist.addTrack", "playlist.removeTrack", "playlist.moveTrack"];
export type SyncActionType = (typeof SYNC_ACTION_TYPES)[number];
export declare class OfflineAction {
    id: string;
    type: SyncActionType;
    payload: Record<string, any>;
}
export declare class ReplayActionsDto {
    actions: OfflineAction[];
}
