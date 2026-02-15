export interface AgentInfo {
    id: string;
    name: string;
    folder?: string;
}

export interface AgentBridgeStateProps {
    activeAgents: AgentInfo[];
    availableAgents: AgentInfo[];
}

export class AgentBridgeState {
    private props: AgentBridgeStateProps;

    constructor(props: AgentBridgeStateProps) {
        this.props = props;
    }

    get activeAgents() { return this.props.activeAgents; }
    get availableAgents() { return this.props.availableAgents; }
}
