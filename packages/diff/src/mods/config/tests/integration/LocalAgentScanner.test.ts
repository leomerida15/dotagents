import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { LocalAgentScanner } from '../../infra/adapters/LocalAgentScanner';

describe('LocalAgentScanner Integration Test', () => {
	const TEST_WORKSPACE = join(process.cwd(), 'temp_test_scanner');

	beforeEach(async () => {
		await mkdir(TEST_WORKSPACE, { recursive: true });
	});

	afterEach(async () => {
		await rm(TEST_WORKSPACE, { recursive: true, force: true });
	});

	it('should detect existing agent markers in the workspace', async () => {
		// 1. Setup mock directories
		await mkdir(join(TEST_WORKSPACE, '.cursor'), { recursive: true });
		await mkdir(join(TEST_WORKSPACE, '.cline'), { recursive: true });

		const scanner = new LocalAgentScanner();

		// 2. Scan
		const detected = await scanner.detectAgents(TEST_WORKSPACE);

		// 3. Verify
		expect(detected).toHaveLength(2);
		const ids = detected.map((a) => a.id).sort();
		expect(ids).toEqual(['cline', 'cursor']);
		expect(detected.find((a) => a.id === 'cursor')?.sourceRoot).toBe('.cursor');
	});

	it('should return an empty list if no agents are found', async () => {
		const scanner = new LocalAgentScanner();
		const detected = await scanner.detectAgents(TEST_WORKSPACE);
		expect(detected).toHaveLength(0);
	});
});
