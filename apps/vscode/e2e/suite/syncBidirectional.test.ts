import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { describe, it, before } from 'node:test';
import * as vscode from 'vscode';

const E2E_AGENT_ID = process.env.DOTAGENTS_E2E_AGENT || 'cursor';
const POLL_MS = 500;
const WAIT_TIMEOUT_MS = 60_000;
const DEBOUNCE_MS = 1_000;

function getWorkspaceRoot(): string {
	const folders = vscode.workspace.workspaceFolders;
	assert.ok(folders && folders.length > 0, 'Need at least one workspace folder');
	return folders[0].uri.fsPath;
}

function waitForFile(filePath: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const start = Date.now();
		function poll() {
			try {
				if (fs.existsSync(filePath)) {
					resolve();
					return;
				}
			} catch (_) {}
			if (Date.now() - start >= WAIT_TIMEOUT_MS) {
				reject(new Error(`Timeout waiting for ${filePath}`));
				return;
			}
			setTimeout(poll, POLL_MS);
		}
		poll();
	});
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('Sync bidireccional E2E', { timeout: 90_000 }, function () {
	let workspaceRoot: string;

	before(async function () {
		workspaceRoot = getWorkspaceRoot();
		const statePath = path.join(workspaceRoot, '.agents', '.ai', 'state.json');
		if (!fs.existsSync(statePath)) {
			await waitForFile(statePath);
		}
		assert.ok(fs.existsSync(statePath), 'Workspace must be initialized (run newProjectSync test first or run full suite)');
	});

	it('inbound: change in IDE source appears in .agents', async function () {
		const cursorRulesDir = path.join(workspaceRoot, '.cursor', 'rules');
		const sourceFile = path.join(cursorRulesDir, 'e2e-inbound.mdc');
		const expectedTarget = path.join(workspaceRoot, '.agents', 'rules', 'e2e-inbound.md');
		const content = '# E2E inbound test\n';

		fs.mkdirSync(cursorRulesDir, { recursive: true });
		fs.writeFileSync(sourceFile, content, 'utf-8');

		await sleep(DEBOUNCE_MS);

		assert.ok(fs.existsSync(expectedTarget), `.agents/rules/e2e-inbound.md should exist after inbound sync`);
		assert.strictEqual(
			fs.readFileSync(expectedTarget, 'utf-8'),
			content,
			'content in .agents should match written content',
		);
	});

	it('outbound: change in .agents appears in IDE source', async function () {
		const agentsRulesDir = path.join(workspaceRoot, '.agents', 'rules');
		const sourceFile = path.join(agentsRulesDir, 'e2e-outbound.md');
		const expectedTarget = path.join(workspaceRoot, '.cursor', 'rules', 'e2e-outbound.mdc');
		const content = '# E2E outbound test\n';

		fs.mkdirSync(agentsRulesDir, { recursive: true });
		fs.writeFileSync(sourceFile, content, 'utf-8');

		await sleep(DEBOUNCE_MS);

		assert.ok(fs.existsSync(expectedTarget), `.cursor/rules/e2e-outbound.mdc should exist after outbound sync`);
		assert.strictEqual(
			fs.readFileSync(expectedTarget, 'utf-8'),
			content,
			'content in .cursor should match written content',
		);
	});

	it('manual sync command executes without human interaction', async function () {
		await assert.doesNotReject(
			vscode.commands.executeCommand('dotagents-vscode.sync'),
			'dotagents-vscode.sync should run without manual UI in E2E mode',
		);
	});
});
