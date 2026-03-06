import * as path from 'path';
import { run as runNodeTests } from 'node:test';
import tsNode from 'ts-node';

/**
 * Bootstraps and executes the E2E test suite with node:test.
 *
 * @returns A promise that resolves when all tests pass
 */
export async function run(): Promise<void> {
	// Es importante configurar ts-node para que transpila on-the-fly los tests cuando se ejecutan en node:test
	// Ya que vscode pasa el path a index.js (compilado) pero este necesita cargar archivos .ts
	tsNode.register({
		transpileOnly: true,
		compilerOptions: {
			module: 'commonjs',
		},
	});

	const suiteRoot = __dirname;
	const files = [
		path.join(suiteRoot, 'extension.test.js'),
		path.join(suiteRoot, 'newProjectSync.test.js'),
		path.join(suiteRoot, 'syncBidirectional.test.js'),
		path.join(suiteRoot, 'addAgentMissingRules.test.js'),
	];

	return new Promise((resolve, reject) => {
		const stream = runNodeTests({ files, timeout: 90_000 });
		let failures = 0;

		stream.on('test:fail', (data) => {
			console.error(`❌ Test failed: ${data.name}`, data.details?.error);
			failures++;
		});

		stream.on('test:pass', (data) => {
			console.log(`✅ Test passed: ${data.name}`);
		});

		stream.on('test:diagnostic', (data) => {
			console.log(`ℹ️ Diagnostic: ${data.message}`);
		});

		stream.on('end', () => {
			if (failures > 0) {
				reject(new Error(`${failures} test(s) failed.`));
			} else {
				resolve();
			}
		});

		stream.on('error', (err) => {
			reject(err);
		});
	});
}
