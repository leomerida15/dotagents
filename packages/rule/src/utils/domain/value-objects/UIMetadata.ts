export interface UIMetadataProps {
    icon?: string;
    color?: string;
    description?: string;
}

export class UIMetadata {
    public readonly icon: string;
    public readonly color: string;
    public readonly description: string;

    constructor(props: UIMetadataProps) {
        this.icon = props.icon || 'gear';
        this.color = props.color || '#cccccc';
        this.description = props.description || '';
    }

    static default() {
        return new UIMetadata({});
    }
}
