import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { describe, it } from 'node:test';
import * as vscode from 'vscode';

const E2E_AGENT_ID = process.env.DOTAGENTS_E2E_AGENT || 'cursor';
const POLL_MS = 500;
const WAIT_TIMEOUT_MS = 60_000;

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

describe('New project Sync E2E', { timeout: WAIT_TIMEOUT_MS + 5000 }, function () {
	it('Sync on clean workspace creates .agents, rules, and state', async function () {
		const workspaceRoot = getWorkspaceRoot();
		assert.ok(
			!fs.existsSync(path.join(workspaceRoot, '.agents')),
			'fixture must start without .agents/',
		);
		const statePath = path.join(workspaceRoot, '.agents', '.ai', 'state.json');
		const installedRulesPath = path.join(
			workspaceRoot,
			'.agents',
			'.ai',
			'rules',
			`${E2E_AGENT_ID}.yaml`,
		);
		const bridgeRulesYaml = path.join(workspaceRoot, '.agents', 'rules', `${E2E_AGENT_ID}.yaml`);

		await vscode.commands.executeCommand('dotagents-vscode.sync');

		await waitForFile(statePath);

		assert.ok(
			fs.existsSync(installedRulesPath),
			`.agents/.ai/rules/${E2E_AGENT_ID}.yaml should exist after sync`,
		);
		assert.ok(
			!fs.existsSync(bridgeRulesYaml),
			`.agents/rules/${E2E_AGENT_ID}.yaml should not exist (YAML lives only under .agents/.ai/rules/)`,
		);
		assert.ok(fs.existsSync(statePath), '.agents/.ai/state.json should exist');

		const stateRaw = fs.readFileSync(statePath, 'utf-8');
		const state = JSON.parse(stateRaw);
		assert.ok(state.manifest, 'state should have manifest');
		assert.strictEqual(
			state.manifest.currentAgent,
			E2E_AGENT_ID,
			'manifest.currentAgent should match E2E agent',
		);
		assert.ok(Array.isArray(state.agents), 'state.agents should be an array');
		const hasAgent = state.agents.some((a: any) => a.id === E2E_AGENT_ID);
		assert.ok(hasAgent, `state.agents should contain ${E2E_AGENT_ID}`);
	});
});
