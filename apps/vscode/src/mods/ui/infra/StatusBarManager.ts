import * as vscode from 'vscode';
import { SyncStatus } from '../../orchestrator/domain/SyncState';

export interface StatusBarManagerProps {
    context: vscode.ExtensionContext;
}

export class StatusBarManager {
    private statusBarItem: vscode.StatusBarItem;

    constructor({ context }: StatusBarManagerProps) {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        this.statusBarItem.command = 'dotagents-vscode.showMenu';
        context.subscriptions.push(this.statusBarItem);
        this.update(SyncStatus.IDLE);
        this.statusBarItem.show();
    }

    public update(status: SyncStatus, message?: string) {
        let icon = '$(sync)';
        let color = new vscode.ThemeColor('statusBar.foreground');
        let tooltip = 'DotAgents: Ready';

        switch (status) {
            case SyncStatus.SYNCING:
                icon = '$(sync~spin)';
                tooltip = 'DotAgents: Syncing...';
                break;
            case SyncStatus.SYNCED:
                icon = '$(check)';
                color = new vscode.ThemeColor('debugIcon.setVariableSymbolForeground'); // Green-ish
                tooltip = 'DotAgents: Synced';
                break;
            case SyncStatus.ERROR:
                icon = '$(error)';
                color = new vscode.ThemeColor('errorForeground');
                tooltip = `DotAgents Error: ${message}`;
                break;
            case SyncStatus.WARNING:
                icon = '$(warning)';
                color = new vscode.ThemeColor('editorWarning.foreground');
                tooltip = `DotAgents Warning: ${message}`;
                break;
        }

        this.statusBarItem.text = `${icon} DotAgents`;
        this.statusBarItem.color = color;
        this.statusBarItem.tooltip = tooltip;
    }
}
