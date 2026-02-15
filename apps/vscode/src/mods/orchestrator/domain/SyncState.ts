export enum SyncStatus {
    IDLE = 'idle',
    SYNCING = 'syncing',
    SYNCED = 'synced',
    ERROR = 'error',
    WARNING = 'warning'
}

export interface SyncStateProps {
    status: SyncStatus;
    lastSyncAt?: number;
    message?: string;
}

export class SyncState {
    private props: SyncStateProps;

    constructor(props: SyncStateProps) {
        this.props = props;
    }

    get status() { return this.props.status; }
    get lastSyncAt() { return this.props.lastSyncAt; }
    get message() { return this.props.message; }

    static createIdle() {
        return new SyncState({ status: SyncStatus.IDLE });
    }
}
