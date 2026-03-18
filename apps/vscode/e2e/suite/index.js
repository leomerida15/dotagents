/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */

const path = require('node:path');
const { run: runNodeTests } = require('node:test');

/**
 * VS Code E2E runner expects a JS entrypoint at --extensionTestsPath.
 * This file bootstraps ts-node and runs the node:test suite over .ts test files.
 *
 * @returns {Promise<void>}
 */
function run() {
	const suiteRoot = __dirname;
	const suite = process.env.DOTAGENTS_E2E_SUITE || 'full';
	const agentId = process.env.DOTAGENTS_E2E_AGENT || 'cursor';

	process.on('uncaughtException', (err) => {
		console.error('❌ uncaughtException:', err);
		if (err && err.stack) console.error(err.stack);
	});
	process.on('unhandledRejection', (err) => {
		console.error('❌ unhandledRejection:', err);
		if (err && err.stack) console.error(err.stack);
	});

	if (suite === 'full' && agentId === 'opencode') {
		// Deterministic opencode E2E flow without node:test to avoid extension-host flakiness.
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const assert = require('node:assert');
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const fs = require('node:fs');
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const vscode = require('vscode');

		const POLL_MS = 500;
		const WAIT_TIMEOUT_MS = 60_000;
		const DEBOUNCE_MS = 1_000;

		const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
		const waitForFile = (filePath) =>
			new Promise((resolve, reject) => {
				const start = Date.now();
				const poll = () => {
					try {
						if (fs.existsSync(filePath)) return resolve();
					} catch {}
					if (Date.now() - start >= WAIT_TIMEOUT_MS) {
						return reject(new Error(`Timeout waiting for ${filePath}`));
					}
					setTimeout(poll, POLL_MS);
				};
				poll();
			});

		return (async () => {
			const waitForWorkspace = () =>
				new Promise((resolve, reject) => {
					const start = Date.now();
					const poll = () => {
						const foldersNow = vscode.workspace.workspaceFolders;
						if (foldersNow && foldersNow.length > 0) return resolve(foldersNow);
						if (Date.now() - start >= 10_000) {
							return reject(new Error('Need at least one workspace folder'));
						}
						setTimeout(poll, 100);
					};
					poll();
				});

			const folders = await waitForWorkspace();
			const workspaceRoot = folders[0].uri.fsPath;

			const extension = vscode.extensions.getExtension('GobernAI.@dotagents/vscode');
			assert.ok(extension, 'dotagents extension should be discoverable by id');
			if (!extension.isActive) await extension.activate();

			// Ensure initialization + rules installed (rule definition lives in .agents/.ai/rules/).
			await vscode.commands.executeCommand('dotagents-vscode.sync');
			const statePath = path.join(workspaceRoot, '.agents', '.ai', 'state.json');
			const installedRulePath = path.join(workspaceRoot, '.agents', '.ai', 'rules', 'opencode.yaml');
			await waitForFile(statePath);
			await waitForFile(installedRulePath);
			// Watchers have a cooldown right after sync; wait it out so file events trigger sync.
			await sleep(6_000);

			// Inbound: .opencode -> .agents (rules/skills/workflows)
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

			await waitForFile(ruleTarget);
			assert.strictEqual(fs.readFileSync(ruleTarget, 'utf-8'), ruleContent);
			await waitForFile(skillTarget);
			assert.strictEqual(fs.readFileSync(skillTarget, 'utf-8'), skillContent);
			await waitForFile(cmdTarget);
			assert.strictEqual(fs.readFileSync(cmdTarget, 'utf-8'), cmdContent);

			// Inbound: opencode.json -> .agents mcp/agents
			const opencodeJsonPath = path.join(workspaceRoot, '.opencode', 'opencode.json');
			assert.ok(fs.existsSync(opencodeJsonPath), 'fixture must include .opencode/opencode.json');
			const mcpTarget = path.join(workspaceRoot, '.agents', 'mcp', 'mcp.json');
			const agentTarget = path.join(workspaceRoot, '.agents', 'agents', 'e2e-agent.json');

			const config = JSON.parse(fs.readFileSync(opencodeJsonPath, 'utf-8'));
			assert.ok(config.mcp, 'opencode.json must have mcp key (fixture or sync output)');
			assert.ok(config.agent, 'opencode.json must have agent key (fixture or sync output)');
			if (!config.mcp['e2e-mcp']) config.mcp['e2e-mcp'] = { command: ['echo'], args: [] };
			if (!config.agent['e2e-agent']) config.agent['e2e-agent'] = { description: 'E2E', prompt: 'test' };
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

			// Outbound: .agents -> .opencode (rules/skills/workflows)
			const agentsRulesDir = path.join(workspaceRoot, '.agents', 'rules');
			const agentsSkillsDir = path.join(workspaceRoot, '.agents', 'skills', 'e2e-out-skill');
			const agentsWorkflowsDir = path.join(workspaceRoot, '.agents', 'workflows');
			fs.mkdirSync(agentsRulesDir, { recursive: true });
			fs.mkdirSync(agentsSkillsDir, { recursive: true });
			fs.mkdirSync(agentsWorkflowsDir, { recursive: true });

			const outRuleSource = path.join(agentsRulesDir, 'e2e-outbound.md');
			const outRuleTarget = path.join(workspaceRoot, '.opencode', 'rules', 'e2e-outbound.md');
			const outRuleContent = '# E2E outbound opencode rule\n';
			fs.writeFileSync(outRuleSource, outRuleContent, 'utf-8');

			const outSkillSource = path.join(agentsSkillsDir, 'SKILL.md');
			const outSkillTarget = path.join(workspaceRoot, '.opencode', 'skills', 'e2e-out-skill', 'SKILL.md');
			const outSkillContent = '# E2E outbound skill\n';
			fs.writeFileSync(outSkillSource, outSkillContent, 'utf-8');

			const wfSource = path.join(agentsWorkflowsDir, 'e2e-workflow.md');
			const wfTarget = path.join(workspaceRoot, '.opencode', 'commands', 'e2e-workflow.md');
			const wfContent = '/e2e-workflow\n\nE2E workflow\n';
			fs.writeFileSync(wfSource, wfContent, 'utf-8');

			await waitForFile(outRuleTarget);
			assert.strictEqual(fs.readFileSync(outRuleTarget, 'utf-8'), outRuleContent);
			await waitForFile(outSkillTarget);
			assert.strictEqual(fs.readFileSync(outSkillTarget, 'utf-8'), outSkillContent);
			await waitForFile(wfTarget);
			assert.strictEqual(fs.readFileSync(wfTarget, 'utf-8'), wfContent);

			// Outbound: .agents mcp/agents -> opencode.json
			const agentsDir = path.join(workspaceRoot, '.agents', 'agents');
			const mcpDir = path.join(workspaceRoot, '.agents', 'mcp');
			fs.mkdirSync(agentsDir, { recursive: true });
			fs.mkdirSync(mcpDir, { recursive: true });

			fs.writeFileSync(
				path.join(agentsDir, 'e2e-agent.json'),
				JSON.stringify({ description: 'E2E Agent', prompt: 'E2E outbound update' }, null, 2),
				'utf-8',
			);
			fs.writeFileSync(
				path.join(mcpDir, 'mcp.json'),
				JSON.stringify({ mcpServers: { 'e2e-mcp': { command: 'echo', args: ['from-agents'] } } }, null, 2),
				'utf-8',
			);

			await sleep(DEBOUNCE_MS);
			const cfg = JSON.parse(fs.readFileSync(opencodeJsonPath, 'utf-8'));
			assert.ok(cfg.agent && cfg.agent['e2e-agent'], 'opencode.json should include agent.e2e-agent');
			assert.strictEqual(cfg.agent['e2e-agent'].prompt, 'E2E outbound update');
			assert.ok(cfg.mcp && cfg.mcp['e2e-mcp'], 'opencode.json should include mcp.e2e-mcp');
			assert.deepStrictEqual(cfg.mcp['e2e-mcp'].command, ['echo', 'from-agents']);

			// Manual sync smoke
			await vscode.commands.executeCommand('dotagents-vscode.sync');
		})();
	}

	if (suite === 'minimal') {
		// Minimal, deterministic smoke-check without node:test (avoid runner flakiness in extension host).
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const assert = require('node:assert');
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const vscode = require('vscode');

		return (async () => {
			const extension = vscode.extensions.getExtension('GobernAI.@dotagents/vscode');
			assert.ok(extension, 'dotagents extension should be discoverable by id');
			if (!extension.isActive) await extension.activate();

			const commands = await vscode.commands.getCommands();
			assert.ok(
				commands.includes('dotagents-vscode.sync'),
				'dotagents-vscode.sync command should be registered',
			);
		})();
	}

	if (suite !== 'minimal') {
		// Transpile E2E tests on-the-fly (they are authored in TypeScript).
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		require('ts-node').register({
			transpileOnly: true,
			skipProject: true,
			compilerOptions: { module: 'commonjs', moduleResolution: 'node' },
		});
	}

	const base = [
		path.join(suiteRoot, 'extension.test.ts'),
		path.join(suiteRoot, 'newProjectSync.test.ts'),
	];
	const cursorOnly = [
		path.join(suiteRoot, 'syncBidirectional.test.ts'),
		path.join(suiteRoot, 'addAgentMissingRules.test.ts'),
	];
	const opencodeOnly = [path.join(suiteRoot, 'syncBidirectionalOpencode.test.ts')];

	const files =
		suite === 'full'
			? agentId === 'opencode'
				? [...base, ...opencodeOnly]
				: [...base, ...cursorOnly]
			: base;

	return new Promise((resolve, reject) => {
		const stream = runNodeTests({ files, timeout: 90_000 });
		let failures = 0;

		stream.on('test:fail', (data) => {
			const details = data.details ?? {};
			const err = details.error;
			if (err && typeof err === 'object') {
				console.error(`❌ Test failed: ${data.name}`);
				console.error(err);
				if (err.stack) console.error(err.stack);
			} else {
				console.error(`❌ Test failed: ${data.name}`, details);
			}
			try {
				console.error('fail event payload:', data);
			} catch {}
			failures++;
		});

		stream.on('test:pass', (data) => {
			console.log(`✅ Test passed: ${data.name}`);
		});

		stream.on('test:diagnostic', (data) => {
			console.log(`ℹ️ Diagnostic: ${data.message}`);
		});

		stream.on('end', () => {
			if (failures > 0) reject(new Error(`${failures} test(s) failed.`));
			else resolve();
		});

		stream.on('error', (err) => reject(err));
	});
}

module.exports = { run };

