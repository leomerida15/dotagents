import * as vscode from 'vscode';

export interface AddAgentManuallyProps {
    onAgentAdded: (agentId: string) => Promise<void>;
}

export class AddAgentManually {
    private onAgentAdded: (agentId: string) => Promise<void>;

    constructor({ onAgentAdded }: AddAgentManuallyProps) {
        this.onAgentAdded = onAgentAdded;
    }

    async execute() {
        // List of known agents (ideally this would come from @dotagents/rule)
        const commonAgents = [
            { label: 'Kilo Code', id: 'kilo' },
            { label: 'Cline', id: 'cline' },
            { label: 'Roo Code', id: 'roo' },
            { label: 'Continue', id: 'continue' },
            { label: 'Cursor', id: 'cursor' },
            { label: 'Custom...', id: 'custom' }
        ];

        const selection = await vscode.window.showQuickPick(commonAgents, {
            placeHolder: 'Select the Agent/IDE to add to synchronization'
        });

        if (!selection) return;

        let agentId = selection.id;

        if (agentId === 'custom') {
            agentId = await vscode.window.showInputBox({
                prompt: 'Enter the Agent ID (e.g., my-custom-agent)',
                placeHolder: 'agent-id'
            }) || '';
        }

        if (agentId) {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Configuring synchronization for ${agentId}...`,
                cancellable: false
            }, async () => {
                await this.onAgentAdded(agentId);
            });

            vscode.window.showInformationMessage(`Agent ${agentId} successfully added.`);
        }
    }
}
