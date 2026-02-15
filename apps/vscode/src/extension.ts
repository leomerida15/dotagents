import * as vscode from 'vscode';
import { StatusBarManager } from './mods/ui/infra/StatusBarManager';
import { StartSyncOrchestration } from './mods/orchestrator/app/StartSyncOrchestration';
import { AddAgentManually } from './mods/agent-bridge/app/AddAgentManually';
import { DiffSyncAdapter } from './mods/orchestrator/infra/DiffSyncAdapter';

/**
 * Entry point para la extensión DotAgents VSCode.
 * Orquestador principal de la sincronización entre el bridge universal .agents y el IDE local.
 */
export function activate(context: vscode.ExtensionContext) {
	console.log('DotAgents VSCode is now active');

	// 1. Inicializar Infraestructura
	const statusBar = new StatusBarManager({ context });
	const syncEngine = new DiffSyncAdapter();

	// 2. Inicializar Casos de Uso
	const startSync = new StartSyncOrchestration({ statusBar, syncEngine });
	const addAgent = new AddAgentManually({
		onAgentAdded: async (agentId) => {
			// Aquí se conectará con @dotagents/rule para persistir la regla
			// y luego disparar una sincronización inicial
			await startSync.execute();
		}
	});

	// 3. Registrar Comandos
	const syncCommand = vscode.commands.registerCommand('dotagents-vscode.sync', async () => {
		await startSync.execute();
	});

	const addAgentCommand = vscode.commands.registerCommand('dotagents-vscode.addAgent', async () => {
		await addAgent.execute();
	});

	const menuCommand = vscode.commands.registerCommand('dotagents-vscode.showMenu', () => {
		vscode.window.showQuickPick([
			{ label: '$(sync) Synchronize Now', id: 'sync' },
			{ label: '$(plus) Add Agent/IDE Manually', id: 'add' },
			{ label: '$(settings) Configure Active Agents', id: 'setup' },
			{ label: '$(question) Generate Rules Prompt', id: 'prompt' }
		]).then(selection => {
			if (selection?.id === 'sync') {
				vscode.commands.executeCommand('dotagents-vscode.sync');
			} else if (selection?.id === 'add') {
				vscode.commands.executeCommand('dotagents-vscode.addAgent');
			}
		});
	});

	context.subscriptions.push(syncCommand, addAgentCommand, menuCommand);

	// 4. Ejecutar sincronización inicial
	startSync.execute();
}

export function deactivate() { }
