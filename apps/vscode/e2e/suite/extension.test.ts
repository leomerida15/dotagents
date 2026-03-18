import * as assert from 'assert';
import { describe, it } from 'node:test';
import * as vscode from 'vscode';

describe('Extension E2E Test Suite', function () {
	it('extension is active and dotagents-vscode.sync command is available', async function () {
		console.log('--- TEST START: extension is active ---');
		const extension = vscode.extensions.getExtension('GobernAI.@dotagents/vscode');
		assert.ok(extension, 'dotagents extension should be discoverable by id');
		if (!extension.isActive) {
			await extension.activate();
		}
		const commands = await vscode.commands.getCommands();
		assert.ok(
			commands.includes('dotagents-vscode.sync'),
			'dotagents-vscode.sync command should be registered',
		);
		console.log('--- TEST END: extension is active ---');
	});

	it('executing dotagents-vscode.showMenu does not throw', async function () {
		if (process.env.DOTAGENTS_E2E === '1') return;
		console.log('--- TEST START: showMenu does not throw ---');
		await assert.doesNotReject(
			vscode.commands.executeCommand('dotagents-vscode.showMenu'),
			'showMenu should not throw',
		);
		console.log('--- TEST END: showMenu does not throw ---');
	});
});
