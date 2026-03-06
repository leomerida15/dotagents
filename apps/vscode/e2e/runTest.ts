import path from 'node:path';
import { runTests } from '@vscode/test-electron';

/**
 * Environment variables used to keep E2E execution deterministic
 * and avoid interactive prompts during test runs.
 */
const E2E_ENV = {
	DOTAGENTS_E2E: '1',
	DOTAGENTS_E2E_AGENT: 'cursor',
	DOTAGENTS_E2E_SYNC_DIRECTION: 'inbound',
};

/**
 * CLI arguments passed to the VS Code test host process.
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
		const extensionDevelopmentPath = path.resolve(__dirname, '../../');

		// The path to test runner
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, './suite/index');

		// Download VS Code, unzip it and run the integration test
		await runTests({
			extensionDevelopmentPath,
			extensionTestsPath,
			extensionTestsEnv: E2E_ENV,
			launchArgs: E2E_LAUNCH_ARGS,
		});
	} catch (error) {
		console.error('Failed to run tests:', error);
		process.exit(1);
	}
}

main();
