import { build } from './bunstart.build';
import { resolve } from 'path';
import { mkdir } from 'fs/promises';

const extensionPackageJsonPath = resolve(process.cwd(), 'package.json');

/**
 * Changes the name field in the extension's package.json.
 *
 * @param newName The new name to set in package.json
 */
async function changePackageName(newName: string) {
	const file = Bun.file(extensionPackageJsonPath);
	const content = await file.json();
	content.name = newName;
	await Bun.write(file, JSON.stringify(content, null, '\t') + '\n');
}

const isMain =
	process.argv[1]?.endsWith('bunstart.publish.ts') ||
	process.argv[1]?.endsWith('bunstart.publish.js');

if (isMain) {
	(async () => {
		let originalName: string | null = null;
		try {
			await build();

			const extensionPkg = await Bun.file(extensionPackageJsonPath).json();
			originalName = extensionPkg.name;

			console.log('Temporarily changing extension package.json name to "dotagents"...');
			await changePackageName('dotagents');

			await mkdir('archive', { recursive: true });

			console.log('Packaging extension...');
			const vsceProc = Bun.spawn(
				['bunx', '-b', '@vscode/vsce', 'package', '--no-dependencies', '--out', 'archive/'],
				{
					cwd: process.cwd(),
					stdout: 'inherit',
					stderr: 'inherit',
				},
			);

			const vsceExit = await vsceProc.exited;
			if (vsceExit !== 0) {
				throw new Error(`vsce package failed with code ${vsceExit}`);
			}
			console.log('VSCode extension packaged successfully in archive/');
		} catch (e) {
			console.error('Build or packaging failed:', e);
			process.exitCode = 1;
		} finally {
			if (!originalName) return;
			console.log(`Reverting extension package.json name to "${originalName}"...`);
			try {
				await changePackageName(originalName);
			} catch (revertError) {
				console.error('Failed to revert package.json name:', revertError);
				process.exitCode = 1;
			}
		}
	})();
}
