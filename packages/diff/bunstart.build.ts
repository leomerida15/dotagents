import bunPluginDts from 'bun-plugin-dts'

/**
 * Build script: compiles TypeScript and emits declaration files.
 */
export async function build(): Promise<void> {
	console.log('Building...');
	await Bun.build({
		entrypoints: ['src/index.ts'],
		outdir: 'dist',
		target: 'bun',
		format: 'esm',
		minify: false,
		sourcemap: false,
		plugins: [
			bunPluginDts({
				libraries: {
					inlinedLibraries: [], // Don't inline anything to avoid pulling in node types incorrectly
				},
				compilationOptions: {
					preferredConfigPath: './tsconfig.json',
					followSymlinks: false,
				},
				output: {
					noBanner: true,
				},
			})
		],
	});

	const proc = Bun.spawn(
		['bun', 'run', 'tsc', '--emitDeclarationOnly', '--declaration', '--outDir', 'dist'],
		{
			cwd: process.cwd(),
			stdout: 'inherit',
			stderr: 'inherit',
		},
	);

	const exitCode = await proc.exited;
	if (exitCode !== 0) {
		throw new Error(`tsc failed with exit code ${exitCode}`);
	}

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
