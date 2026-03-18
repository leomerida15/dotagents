import path from 'node:path';
import { runTests } from '@vscode/test-electron';

/**
 * Environment variables used to keep E2E execution deterministic
 * and avoid interactive prompts during test runs.
 */
const E2E_ENV = {
	DOTAGENTS_E2E: '1',
	DOTAGENTS_E2E_AGENT: process.env.DOTAGENTS_E2E_AGENT || 'cursor',
	DOTAGENTS_E2E_SYNC_DIRECTION: process.env.DOTAGENTS_E2E_SYNC_DIRECTION || 'inbound',
	DOTAGENTS_E2E_SUITE: process.env.DOTAGENTS_E2E_SUITE || 'minimal',
};

/**
 * CLI arguments passed to the VS Code test host process.
 *
 * NOTE: We resolve paths from the extension repo root (not __dirname),
 * because the runner can be bundled/transpiled and __dirname may not be stable.
 */
const E2E_LAUNCH_ARGS = ['--disable-workspace-trust'];

/**
 * Main entry point for the E2E test runner.
 * Configures and launches the VS Code extension test environment.
 *
 * @returns A promise resolving when the tests finish executing
 */
async function main() {
	try {
		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
		// NOTE: prefer cwd because bundling/transpilation can change __dirname.
		const extensionDevelopmentPath =
			process.env.DOTAGENTS_E2E_EXTENSION_PATH || process.cwd();

		const fixtureName = process.env.DOTAGENTS_E2E_FIXTURE || 'newProjectWithCursor';
		const workspacePath = path.resolve(extensionDevelopmentPath, 'e2e', 'fixtures', fixtureName);
		console.log('[E2E] fixtureName:', fixtureName);
		console.log('[E2E] workspacePath:', workspacePath);

		// Make E2E runs coexist with a regular VS Code instance by isolating user-data/extensions dirs.
		// Also make these paths unique per agent/fixture to avoid instance-lock collisions.
		const agentId = E2E_ENV.DOTAGENTS_E2E_AGENT;
		const userDataDir = path.resolve(
			extensionDevelopmentPath,
			'.vscode-test',
			`user-data-e2e-${agentId}-${fixtureName}`,
		);
		const extensionsDir = path.resolve(
			extensionDevelopmentPath,
			'.vscode-test',
			`extensions-e2e-${agentId}-${fixtureName}`,
		);

		// The path to test runner
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(extensionDevelopmentPath, 'e2e', 'suite', 'index');

		// Download VS Code, unzip it and run the integration test
		await runTests({
			extensionDevelopmentPath,
			extensionTestsPath,
			extensionTestsEnv: E2E_ENV,
			launchArgs: [
				'--user-data-dir',
				userDataDir,
				'--extensions-dir',
				extensionsDir,
				workspacePath,
				...E2E_LAUNCH_ARGS,
			],
		});
	} catch (error) {
		console.error('Failed to run tests:', error);
		process.exit(1);
	}
}

main();
