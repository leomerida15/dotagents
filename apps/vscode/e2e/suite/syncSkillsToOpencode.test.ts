import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { describe, it, before } from 'node:test';
import * as vscode from 'vscode';

const POLL_MS = 500;
const WAIT_TIMEOUT_MS = 60_000;

function getWorkspaceRoot(): string {
	const folders = vscode.workspace.workspaceFolders;

	if (!folders || folders.length === 0) {
		throw new Error('Need at least one workspace folder');
	}

	const firstFolder = folders[0];
	if (!firstFolder) {
		throw new Error('No workspace folder found');
	}

	return firstFolder.uri.fsPath;
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

describe('Sync Skills to Opencode E2E', { timeout: WAIT_TIMEOUT_MS + 5000 }, function () {
	let workspaceRoot: string;
	let agentsSkillsPath: string;

	before(async function () {
		// Check if we're running with opencode agent
		const E2E_AGENT_ID = process.env.DOTAGENTS_E2E_AGENT || 'cursor';
		const E2E_AGENT_ID_OPENV = 'opencode';

		if (E2E_AGENT_ID !== E2E_AGENT_ID_OPENV) {
			// Skip the test by returning early
			return;
		}

		workspaceRoot = getWorkspaceRoot();
		agentsSkillsPath = path.join(workspaceRoot, '.agents', 'skills');
	});

	it('Sync Now copies skills from .agents to .opencode (via .agents/skills)', async function () {
		// Check if we're running with opencode agent
		const E2E_AGENT_ID = process.env.DOTAGENTS_E2E_AGENT || 'cursor';
		const E2E_AGENT_ID_OPENV = 'opencode';

		if (E2E_AGENT_ID !== E2E_AGENT_ID_OPENV) {
			// Skip the test
			return;
		}

		// Trigger the sync command (inbound: from .agents to IDE/agent)
		await vscode.commands.executeCommand('dotagents-vscode.sync');

		// Wait for sync to complete by checking for the opencode rules file
		const opencodeRulesPath = path.join(
			workspaceRoot,
			'.agents',
			'rules',
			`${E2E_AGENT_ID_OPENV}.yaml`,
		);
		await waitForFile(opencodeRulesPath);

		// Verify that the skills directory exists in .agents
		assert.ok(
			fs.existsSync(agentsSkillsPath),
			'.agents/skills directory should exist after sync',
		);

		// Verify that the skills directory is not empty (at least one skill file)
		const skillFiles = fs.readdirSync(agentsSkillsPath);
		assert.ok(
			skillFiles.length > 0,
			'.agents/skills directory should contain at least one skill file',
		);
	});
});
