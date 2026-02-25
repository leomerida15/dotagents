import { build } from "./bunstart.build";
import { resolve } from "path";
import { mkdir } from "fs/promises";

const rootPackageJsonPath = resolve(process.cwd(), "../../package.json");

async function changePackageName(newName: string) {
	const file = Bun.file(rootPackageJsonPath);
	const content = await file.json();
	content.name = newName;
	await Bun.write(file, JSON.stringify(content, null, '\t') + '\n');
}

const isMain =
	process.argv[1]?.endsWith('bunstart.publich.ts') ||
	process.argv[1]?.endsWith('bunstart.publich.js');

if (isMain) {
	(async () => {
		try {
			await build();

			console.log('Temporarily changing root package.json name to "dotagents"...');
			await changePackageName('dotagents');

			await mkdir('archive', { recursive: true });

			console.log('Packaging extension...');
			const vsceProc = Bun.spawn(['bunx', '-b', '@vscode/vsce', 'package', '--no-dependencies', '--out', 'archive/'], {
				cwd: process.cwd(),
				stdout: 'inherit',
				stderr: 'inherit',
			});

			const vsceExit = await vsceProc.exited;
			if (vsceExit !== 0) {
				throw new Error(`vsce package failed with code ${vsceExit}`);
			}
			console.log('VSCode extension packaged successfully in archive/');
		} catch (e) {
			console.error('Build or packaging failed:', e);
			process.exitCode = 1;
		} finally {
			console.log('Reverting root package.json name to "@dotagents/vscode"...');
			try {
				await changePackageName('@dotagents/vscode');
			} catch (revertError) {
				console.error('Failed to revert package.json name:', revertError);
				process.exitCode = 1;
			}
		}
	})();
}
