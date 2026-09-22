export declare class TrackProductEventDto {
    eventName: 'screen_view' | 'screen_duration' | 'feature_used' | 'workflow_started' | 'workflow_completed' | 'workflow_abandoned' | 'tap';
    screen?: string;
    feature?: string;
    actionKey?: string;
    outcome?: string;
    durationMs?: number;
}
