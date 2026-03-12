import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { describe, it, before, after } from 'node:test';
import * as vscode from 'vscode';

const WAIT_TIMEOUT_MS = 60_000;
const POLL_MS = 500;
const E2E_AGENT_ID = process.env.DOTAGENTS_E2E_AGENT || 'cursor';

function getWorkspaceRoot(): string {
	const folders = vscode.workspace.workspaceFolders;
	assert.ok(folders && folders.length > 0, 'Need at least one workspace folder');
	return folders[0].uri.fsPath;
}

function waitForFile(filePath: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const start = Date.now();
		function poll() {
			if (fs.existsSync(filePath)) return resolve();
			if (Date.now() - start >= WAIT_TIMEOUT_MS) {
				return reject(new Error(`Timeout waiting for ${filePath}`));
			}
			setTimeout(poll, POLL_MS);
		}
		poll();
	});
}

function readState(workspaceRoot: string): any {
	const statePath = path.join(workspaceRoot, '.agents', '.ai', 'state.json');
	return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
}

function writeLocalRule(workspaceRoot: string, agentId: string): string {
	const rulesDir = path.join(workspaceRoot, '.agents', 'rules');
	fs.mkdirSync(rulesDir, { recursive: true });
	const rulePath = path.join(rulesDir, `${agentId}.yaml`);
	const content = `version: "1.0"
agent:
  id: "${agentId}"
  name: "E2E Agent"

paths:
  - path: ".${agentId}/"
    scope: "workspace"
    type: "directory"
    purpose: "marker"

mapping:
  inbound:
    - from: "rules/"
      to: "rules/"
      format: "directory"
      source_ext: ".mdc"
      target_ext: ".md"
  outbound:
    - from: "rules/"
      to: "rules/"
      format: "directory"
      source_ext: ".md"
      target_ext: ".mdc"

target_standard: ".agents/"
`;
	fs.writeFileSync(rulePath, content, 'utf-8');
	return rulePath;
}

describe('Add Agent & Missing Rules E2E', { timeout: 90_000 }, function () {
	let workspaceRoot: string;
	let originalShowQuickPick: typeof vscode.window.showQuickPick;
	let originalShowInputBox: typeof vscode.window.showInputBox;
	let originalShowWarningMessage: typeof vscode.window.showWarningMessage;
	let originalShowInformationMessage: typeof vscode.window.showInformationMessage;
	let originalShowTextDocument: typeof vscode.window.showTextDocument;
	const infoMessages: string[] = [];
	const warningMessages: string[] = [];
	const openedDocs: string[] = [];

	before(async function () {
		workspaceRoot = getWorkspaceRoot();
		const statePath = path.join(workspaceRoot, '.agents', '.ai', 'state.json');
		await waitForFile(statePath);

		originalShowQuickPick = vscode.window.showQuickPick;
		originalShowInputBox = vscode.window.showInputBox;
		originalShowWarningMessage = vscode.window.showWarningMessage;
		originalShowInformationMessage = vscode.window.showInformationMessage;
		originalShowTextDocument = vscode.window.showTextDocument;

		infoMessages.length = 0;
		warningMessages.length = 0;
		openedDocs.length = 0;

		vscode.window.showInformationMessage = (async (message: string) => {
			infoMessages.push(String(message));
			return undefined;
		}) as any;
		vscode.window.showWarningMessage = (async (message: string, ...items: any[]) => {
			warningMessages.push(String(message));
			return items[0];
		}) as any;
		vscode.window.showTextDocument = async (docOrUri: any) => {
			const docPath = docOrUri && docOrUri.fsPath ? docOrUri.fsPath : String(docOrUri);
			openedDocs.push(docPath);
			return {} as any;
		};
	});

	after(function () {
		vscode.window.showQuickPick = originalShowQuickPick;
		vscode.window.showInputBox = originalShowInputBox;
		vscode.window.showWarningMessage = originalShowWarningMessage;
		vscode.window.showInformationMessage = originalShowInformationMessage;
		vscode.window.showTextDocument = originalShowTextDocument;
	});

	it('Add Agent with local rule adds agent and keeps rule in disk', async function () {
		const agentId = 'e2e-agent';
		const rulePath = writeLocalRule(workspaceRoot, agentId);
		const canonicalRulePath = path.join(workspaceRoot, '.agents', 'rules', `${agentId}.yaml`);
		const legacyRulePath = path.join(
			workspaceRoot,
			'.agents',
			'.ai',
			'rules',
			`${agentId}.yaml`,
		);
		fs.mkdirSync(path.join(workspaceRoot, '.e2e-agent', 'rules'), { recursive: true });

		vscode.window.showQuickPick = (async (items: any, options: any) => {
			const placeHolder = options?.placeHolder || '';
			if (placeHolder.includes('Select the Agent/IDE to add')) {
				return (
					items.find((item: any) => item.id === agentId) ??
					items.find((item: any) => item.label === agentId) ??
					items[0]
				);
			}
			return undefined;
		}) as any;
		vscode.window.showInputBox = async () => undefined;

		await vscode.commands.executeCommand('dotagents-vscode.addAgent');

		assert.ok(fs.existsSync(rulePath), `${rulePath} should exist`);
		assert.ok(fs.existsSync(canonicalRulePath), `${canonicalRulePath} should exist`);
		assert.ok(!fs.existsSync(legacyRulePath), `${legacyRulePath} should not exist`);
		const state = readState(workspaceRoot);
		assert.ok(
			state.agents.some((a: any) => a.id === agentId),
			'state.agents should include newly added agent',
		);
	});

	it('Add Agent without rule opens make_rule prompt and informs user', async function () {
		const missingAgentId = 'agent-without-rule';

		vscode.window.showQuickPick = (async (items: any, options: any) => {
			const placeHolder = options?.placeHolder || '';
			if (placeHolder.includes('Select the Agent/IDE to add')) {
				return items.find((item: any) => item.id === 'custom');
			}
			return undefined;
		}) as any;
		vscode.window.showInputBox = async () => missingAgentId;

		await vscode.commands.executeCommand('dotagents-vscode.addAgent');

		const promptPath = path.join(
			workspaceRoot,
			'.agents',
			'.ai',
			'rules',
			'make_rule_prompt.md',
		);
		assert.ok(fs.existsSync(promptPath), 'make_rule_prompt.md should exist');
		assert.ok(
			openedDocs.some((p) =>
				p.endsWith(path.join('.agents', '.ai', 'rules', 'make_rule_prompt.md')),
			),
			'make_rule_prompt.md should be opened',
		);
		assert.ok(
			infoMessages.some((m) => m.includes(`No rule for ${missingAgentId}`)),
			'should show info message for missing rule',
		);
	});

	it('Sync with missing active rule warns about missing rules', async function () {
		const rulePath = path.join(workspaceRoot, '.agents', 'rules', `${E2E_AGENT_ID}.yaml`);
		const backupPath = `${rulePath}.bak`;
		if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
		fs.renameSync(rulePath, backupPath);
		try {
			await vscode.commands.executeCommand('dotagents-vscode.sync');
			assert.ok(
				warningMessages.some(
					(m) =>
						m.includes('Some tools have no rules installed') &&
						m.includes(E2E_AGENT_ID),
				),
				'should warn that active agent has no installed rules',
			);
		} finally {
			if (fs.existsSync(backupPath)) fs.renameSync(backupPath, rulePath);
		}
	});
});
