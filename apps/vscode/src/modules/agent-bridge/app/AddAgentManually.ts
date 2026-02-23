import * as vscode from 'vscode';

export interface AddAgentManuallyProps {
    getAgentsForPicker: (workspaceRoot: string) => Promise<Array<{ id: string; label: string }>>;
    onAgentAdded: (agentId: string) => Promise<void>;
}

export class AddAgentManually {
    private getAgentsForPicker: (workspaceRoot: string) => Promise<Array<{ id: string; label: string }>>;
    private onAgentAdded: (agentId: string) => Promise<void>;

    constructor({ getAgentsForPicker, onAgentAdded }: AddAgentManuallyProps) {
        this.getAgentsForPicker = getAgentsForPicker;
        this.onAgentAdded = onAgentAdded;
    }

    async execute() {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
            vscode.window.showErrorMessage('No workspace open.');
            return;
        }

        const agents = await this.getAgentsForPicker(workspaceRoot);
        const commonAgents = agents.map((a) => ({ label: a.label, id: a.id }));
        commonAgents.push({ label: 'Custom...', id: 'custom' });

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
