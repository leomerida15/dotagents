import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { DiffSyncAdapter } from '../infra/DiffSyncAdapter';
import { NodeConfigRepository } from '../infra/NodeConfigRepository';
import { SyncManifest } from '@dotagents/diff';
import { Configuration } from '@dotagents/diff';

// Mock the ClientModule to avoid actual file system operations
const mockListRules = mock(() => Promise.resolve([]));

// Create a mock for the config repository
class MockConfigRepository extends NodeConfigRepository {
	constructor() {
		super();
	}

	override async load(workspaceRoot: string): Promise<Configuration> {
		return Configuration.create({
			workspaceRoot,
			agents: [],
			manifest: SyncManifest.createEmpty(),
		});
	}

	override async save(config: Configuration): Promise<void> {
		// Mock save implementation
		return;
	}
}

describe('DiffSyncAdapter - syncOutboundAgent', () => {
	let adapter: DiffSyncAdapter;
	let mockConfigRepository: MockConfigRepository;

	beforeEach(() => {
		mockConfigRepository = new MockConfigRepository();
		adapter = new DiffSyncAdapter({
			configRepository: mockConfigRepository,
		});
	});

	it('should NOT call updateAgentTrackOnly unconditionally after conditional logic', async () => {
		// Setup: Create a manifest with initial state
		const manifest = SyncManifest.createEmpty();
		manifest.markAsSynced('antigravity');
		const initialBridgeTime = manifest.lastProcessedAt;

		// Mock the repository to return our configured manifest
		mockConfigRepository.load = async (workspaceRoot: string) =>
			Configuration.create({
				workspaceRoot,
				agents: [],
				manifest: manifest,
			});

		// Track save calls to verify state changes
		let savedConfig: Configuration | null = null;
		mockConfigRepository.save = async (config: Configuration) => {
			savedConfig = config;
		};

		// Mock the syncProject to simulate no changes (empty result)
		const originalSyncProject = (adapter as any).syncProject;
		(adapter as any).syncProject = {
			execute: async () => ({
				actionsPerformed: [],
				writtenPaths: [],
			}),
		};

		// Execute syncOutboundAgent with the same agent (no changes, same agent)
		await adapter.syncOutboundAgent('/workspace', 'antigravity');

		// Verify: The bridge state should NOT have changed (only agent tracking should update)
		expect(savedConfig).toBeDefined();
		expect(savedConfig!.manifest.lastProcessedAt).toBe(initialBridgeTime);
		expect(savedConfig!.manifest.currentAgent).toBe('antigravity');
		expect(savedConfig!.manifest.lastActiveAgent).toBe('antigravity');
	});

	it('should update bridge state when agent changes', async () => {
		// Setup: Create a manifest with initial state
		const manifest = SyncManifest.createEmpty();
		manifest.markAsSynced('antigravity');
		const initialBridgeTime = manifest.lastProcessedAt;

		// Mock the repository to return our configured manifest
		mockConfigRepository.load = async (workspaceRoot: string) =>
			Configuration.create({
				workspaceRoot,
				agents: [],
				manifest: manifest,
			});

		// Track save calls to verify state changes
		let savedConfig: Configuration | null = null;
		mockConfigRepository.save = async (config: Configuration) => {
			savedConfig = config;
		};

		// Mock the syncProject to simulate no changes
		(adapter as any).syncProject = {
			execute: async () => ({
				actionsPerformed: [],
				writtenPaths: [],
			}),
		};

		// Execute syncOutboundAgent with a different agent
		await adapter.syncOutboundAgent('/workspace', 'cursor');

		// Verify: The bridge state SHOULD have changed because agent changed
		expect(savedConfig).toBeDefined();
		expect(savedConfig!.manifest.lastProcessedAt).toBeGreaterThan(initialBridgeTime);
		expect(savedConfig!.manifest.currentAgent).toBe('cursor');
		expect(savedConfig!.manifest.lastActiveAgent).toBe('cursor');
	});

	it('should update bridge state when there are changes', async () => {
		// Setup: Create a manifest with initial state
		const manifest = SyncManifest.createEmpty();
		manifest.markAsSynced('antigravity');
		const initialBridgeTime = manifest.lastProcessedAt;

		// Mock the repository to return our configured manifest
		mockConfigRepository.load = async (workspaceRoot: string) =>
			Configuration.create({
				workspaceRoot,
				agents: [],
				manifest: manifest,
			});

		// Track save calls to verify state changes
		let savedConfig: Configuration | null = null;
		mockConfigRepository.save = async (config: Configuration) => {
			savedConfig = config;
		};

		// Mock the syncProject to simulate changes
		(adapter as any).syncProject = {
			execute: async () => ({
				actionsPerformed: [{ target: '/some/path' }],
				writtenPaths: ['/some/path'],
			}),
		};

		// Execute syncOutboundAgent with the same agent but with changes
		await adapter.syncOutboundAgent('/workspace', 'antigravity');

		// Verify: The bridge state SHOULD have changed because there were changes
		expect(savedConfig).toBeDefined();
		expect(savedConfig!.manifest.lastProcessedAt).toBeGreaterThan(initialBridgeTime);
		expect(savedConfig!.manifest.currentAgent).toBe('antigravity');
		expect(savedConfig!.manifest.lastActiveAgent).toBe('antigravity');
	});
});
