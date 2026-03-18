import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { before, describe, it } from 'node:test';
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

describe('Sync bidireccional (opencode) E2E', { timeout: 120_000 }, function () {
	let workspaceRoot: string;

	before(async function () {
		if (E2E_AGENT_ID !== 'opencode') return;

		workspaceRoot = getWorkspaceRoot();
		const statePath = path.join(workspaceRoot, '.agents', '.ai', 'state.json');
		if (!fs.existsSync(statePath)) {
			await waitForFile(statePath);
		}
		assert.ok(
			fs.existsSync(statePath),
			'Workspace must be initialized (run newProjectSync test first or run full suite)',
		);
	});

	it('inbound: .opencode → .agents (rules/skills/workflows)', async function () {
		if (E2E_AGENT_ID !== 'opencode') return;

		const rulesDir = path.join(workspaceRoot, '.opencode', 'rules');
		const skillsDir = path.join(workspaceRoot, '.opencode', 'skills', 'e2e-skill');
		const commandsDir = path.join(workspaceRoot, '.opencode', 'commands');

		fs.mkdirSync(rulesDir, { recursive: true });
		fs.mkdirSync(skillsDir, { recursive: true });
		fs.mkdirSync(commandsDir, { recursive: true });

		const ruleSource = path.join(rulesDir, 'e2e-inbound.md');
		const ruleTarget = path.join(workspaceRoot, '.agents', 'rules', 'e2e-inbound.md');
		const ruleContent = '# E2E inbound opencode rule\n';
		fs.writeFileSync(ruleSource, ruleContent, 'utf-8');

		const skillSource = path.join(skillsDir, 'SKILL.md');
		const skillTarget = path.join(workspaceRoot, '.agents', 'skills', 'e2e-skill', 'SKILL.md');
		const skillContent = '# E2E skill\n';
		fs.writeFileSync(skillSource, skillContent, 'utf-8');

		const cmdSource = path.join(commandsDir, 'e2e-cmd.md');
		const cmdTarget = path.join(workspaceRoot, '.agents', 'workflows', 'e2e-cmd.md');
		const cmdContent = '/e2e-cmd\n\nE2E command\n';
		fs.writeFileSync(cmdSource, cmdContent, 'utf-8');

		await sleep(DEBOUNCE_MS);

		assert.ok(fs.existsSync(ruleTarget), 'inbound should create .agents/rules/e2e-inbound.md');
		assert.strictEqual(fs.readFileSync(ruleTarget, 'utf-8'), ruleContent);

		assert.ok(fs.existsSync(skillTarget), 'inbound should create .agents/skills/e2e-skill/SKILL.md');
		assert.strictEqual(fs.readFileSync(skillTarget, 'utf-8'), skillContent);

		assert.ok(fs.existsSync(cmdTarget), 'inbound should create .agents/workflows/e2e-cmd.md');
		assert.strictEqual(fs.readFileSync(cmdTarget, 'utf-8'), cmdContent);
	});

	it('inbound: .opencode/opencode.json → .agents (mcp/agents)', async function () {
		if (E2E_AGENT_ID !== 'opencode') return;

		const opencodeJsonPath = path.join(workspaceRoot, '.opencode', 'opencode.json');
		assert.ok(fs.existsSync(opencodeJsonPath), 'fixture must include .opencode/opencode.json');

		const mcpTarget = path.join(workspaceRoot, '.agents', 'mcp', 'mcp.json');
		const agentTarget = path.join(workspaceRoot, '.agents', 'agents', 'e2e-agent.json');

		const config = JSON.parse(fs.readFileSync(opencodeJsonPath, 'utf-8'));
		config.mcp['e2e-mcp'].command = ['echo', 'hello', 'inbound'];
		config.agent['e2e-agent'].prompt = 'E2E inbound update';
		fs.writeFileSync(opencodeJsonPath, JSON.stringify(config, null, 2), 'utf-8');

		await waitForFile(mcpTarget);
		await waitForFile(agentTarget);

		const mcpJson = JSON.parse(fs.readFileSync(mcpTarget, 'utf-8'));
		assert.ok(mcpJson.mcpServers, 'mcp.json should contain mcpServers');
		assert.ok(mcpJson.mcpServers['e2e-mcp'], 'mcpServers should contain e2e-mcp');
		assert.strictEqual(mcpJson.mcpServers['e2e-mcp'].command, 'echo');
		assert.deepStrictEqual(mcpJson.mcpServers['e2e-mcp'].args, ['hello', 'inbound']);

		const agentJson = JSON.parse(fs.readFileSync(agentTarget, 'utf-8'));
		assert.strictEqual(agentJson.prompt, 'E2E inbound update');
	});

	it('outbound: .agents → .opencode (rules/skills/workflows)', async function () {
		if (E2E_AGENT_ID !== 'opencode') return;

		const agentsRulesDir = path.join(workspaceRoot, '.agents', 'rules');
		const agentsSkillsDir = path.join(workspaceRoot, '.agents', 'skills', 'e2e-out-skill');
		const agentsWorkflowsDir = path.join(workspaceRoot, '.agents', 'workflows');

		fs.mkdirSync(agentsRulesDir, { recursive: true });
		fs.mkdirSync(agentsSkillsDir, { recursive: true });
		fs.mkdirSync(agentsWorkflowsDir, { recursive: true });

		const ruleSource = path.join(agentsRulesDir, 'e2e-outbound.md');
		const ruleTarget = path.join(workspaceRoot, '.opencode', 'rules', 'e2e-outbound.md');
		const ruleContent = '# E2E outbound opencode rule\n';
		fs.writeFileSync(ruleSource, ruleContent, 'utf-8');

		const skillSource = path.join(agentsSkillsDir, 'SKILL.md');
		const skillTarget = path.join(workspaceRoot, '.opencode', 'skills', 'e2e-out-skill', 'SKILL.md');
		const skillContent = '# E2E outbound skill\n';
		fs.writeFileSync(skillSource, skillContent, 'utf-8');

		const wfSource = path.join(agentsWorkflowsDir, 'e2e-workflow.md');
		const wfTarget = path.join(workspaceRoot, '.opencode', 'commands', 'e2e-workflow.md');
		const wfContent = '/e2e-workflow\n\nE2E workflow\n';
		fs.writeFileSync(wfSource, wfContent, 'utf-8');

		await sleep(DEBOUNCE_MS);

		assert.ok(fs.existsSync(ruleTarget), 'outbound should create .opencode/rules/e2e-outbound.md');
		assert.strictEqual(fs.readFileSync(ruleTarget, 'utf-8'), ruleContent);

		assert.ok(fs.existsSync(skillTarget), 'outbound should create .opencode/skills/e2e-out-skill/SKILL.md');
		assert.strictEqual(fs.readFileSync(skillTarget, 'utf-8'), skillContent);

		assert.ok(fs.existsSync(wfTarget), 'outbound should create .opencode/commands/e2e-workflow.md');
		assert.strictEqual(fs.readFileSync(wfTarget, 'utf-8'), wfContent);
	});

	it('outbound: .agents (mcp/agents) → .opencode/opencode.json', async function () {
		if (E2E_AGENT_ID !== 'opencode') return;

		const agentsDir = path.join(workspaceRoot, '.agents', 'agents');
		const mcpDir = path.join(workspaceRoot, '.agents', 'mcp');
		fs.mkdirSync(agentsDir, { recursive: true });
		fs.mkdirSync(mcpDir, { recursive: true });

		const mcpSource = path.join(mcpDir, 'mcp.json');
		const opencodeJsonPath = path.join(workspaceRoot, '.opencode', 'opencode.json');

		fs.writeFileSync(
			path.join(agentsDir, 'e2e-agent.json'),
			JSON.stringify({ description: 'E2E Agent', prompt: 'E2E outbound update' }, null, 2),
			'utf-8',
		);
		fs.writeFileSync(
			mcpSource,
			JSON.stringify({ mcpServers: { 'e2e-mcp': { command: 'echo', args: ['from-agents'] } } }, null, 2),
			'utf-8',
		);

		await sleep(DEBOUNCE_MS);

		assert.ok(fs.existsSync(opencodeJsonPath), 'opencode.json should exist after outbound sync');
		const cfg = JSON.parse(fs.readFileSync(opencodeJsonPath, 'utf-8'));
		assert.ok(cfg.agent && cfg.agent['e2e-agent'], 'opencode.json should include agent.e2e-agent');
		assert.strictEqual(cfg.agent['e2e-agent'].prompt, 'E2E outbound update');

		assert.ok(cfg.mcp && cfg.mcp['e2e-mcp'], 'opencode.json should include mcp.e2e-mcp');
		assert.deepStrictEqual(cfg.mcp['e2e-mcp'].command, ['echo', 'from-agents']);
	});

	it('manual sync command executes without human interaction', async function () {
		if (E2E_AGENT_ID !== 'opencode') return;

		await assert.doesNotReject(
			vscode.commands.executeCommand('dotagents-vscode.sync'),
			'dotagents-vscode.sync should run without manual UI in E2E mode',
		);
	});
});

