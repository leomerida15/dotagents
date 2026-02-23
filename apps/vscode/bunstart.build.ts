
/**
 * Build script: compiles TypeScript and emits declaration files.
 */
export async function build(): Promise<void> {
	const genProc = Bun.spawn(['bun', 'run', 'scripts/generate-known-agents.ts'], {
		cwd: process.cwd(),
		stdout: 'inherit',
		stderr: 'inherit',
	});
	const genExit = await genProc.exited;
	if (genExit !== 0) {
		throw new Error(`generate-known-agents.ts failed with code ${genExit}`);
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


	console.log('Build completed');
}

const isMain =
	process.argv[1]?.endsWith('bunstart.build.ts') ||
	process.argv[1]?.endsWith('bunstart.build.js');
if (isMain) {
	build().catch((e) => {
		console.error('Build failed', e);
		process.exit(1);
	});
}
