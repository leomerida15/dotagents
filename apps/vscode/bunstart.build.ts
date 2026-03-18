import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Build script: compiles TypeScript and emits declaration files.
 * Invokes the known-agents generation script before compiling the main extension entry point.
 *
 * @returns A promise resolving when the build completes successfully
 */
export async function build(): Promise<void> {
	const generationProcess = Bun.spawn(['bun', 'run', '-b', 'scripts/generate-known-agents.ts'], {
		cwd: process.cwd(),
		stdout: 'inherit',
		stderr: 'inherit',
	});
	const exitCode = await generationProcess.exited;
	if (exitCode !== 0) {
		throw new Error(`generate-known-agents.ts failed with code ${exitCode}`);
	}
	console.log('Building...');
	await Bun.build({
		entrypoints: ['src/extension.ts'],
		outdir: 'dist',
		target: 'node',
		format: 'cjs',
		minify: false,
		sourcemap: false,
		external: ['vscode'],
	});

	// Bun can inline workspace ESM (e.g. @dotagents/rule dist) that uses import.meta.require.
	// In CJS that is invalid; replace with require so the extension runs in Node.
	const outPath = join(process.cwd(), 'dist', 'extension.js');
	let code = readFileSync(outPath, 'utf-8');
	if (code.includes('import.meta.require')) {
		code = code.replace(/import\.meta\.require/g, 'require');
		writeFileSync(outPath, code, 'utf-8');
	}

	console.log('Build completed');
}

const isMain =
	process.argv[1]?.endsWith('bunstart.build.ts') ||
	process.argv[1]?.endsWith('bunstart.build.js');
if (isMain) {
	build().catch((buildError) => {
		console.error('Build failed', buildError);
		process.exit(1);
	});
}
