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
