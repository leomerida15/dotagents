
import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { rm, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { FsInstalledRuleRepository } from '../../infra';
import { AgentID } from '@rule/utils/domain';

describe('FsInstalledRuleRepository Integration Test', () => {
  const TEST_AI_PATH = join(process.cwd(), '.agents', '.ai', 'rules');

  beforeEach(async () => {
    await mkdir(TEST_AI_PATH, { recursive: true });
  });

  afterEach(async () => {
    await rm(join(process.cwd(), '.agents'), { recursive: true, force: true });
  });

  it('should read rules from .agents/.ai/rules subdirectory', async () => {
    // 1. Setup - Create a dummy YAML rule file
    const ruleContent = `
version: "1.0"
agent:
  id: "test-agent"
  name: "Test Agent"
source_root: ".test/"
mapping:
  inbound:
    - from: "config.json"
      to: "mcp/config.json"
      format: "json"
  outbound:
    - from: "mcp/config.json"
      to: "config.json"
target_standard: ".agents/"
`;
    await writeFile(join(TEST_AI_PATH, 'test-agent.yaml'), ruleContent);

    // 2. Instantiate Repository (uses default path which should be updated)
    const repo = new FsInstalledRuleRepository();

    // 3. Get Rule
    const rule = repo.getRule(new AgentID('test-agent'));

    // 4. Verify
    expect(rule).not.toBeNull();
    expect(rule?.id.toString()).toBe('test-agent');
    expect(rule?.name).toBe('Test Agent');
  });

  it('should return all rules from the directory', async () => {
    // 1. Setup
    const ruleContent1 = `
version: "1.0"
agent: { id: "agent1", name: "Agent 1" }
source_root: "./"
mapping: { inbound: [], outbound: [] }
target_standard: ".agents/"
`;
    const ruleContent2 = `
version: "1.0"
agent: { id: "agent2", name: "Agent 2" }
source_root: "./"
mapping: { inbound: [], outbound: [] }
target_standard: ".agents/"
`;
    await writeFile(join(TEST_AI_PATH, 'agent1.yaml'), ruleContent1);
    await writeFile(join(TEST_AI_PATH, 'agent2.yaml'), ruleContent2);

    // 2. Execute
    const repo = new FsInstalledRuleRepository();
    const rules = repo.getAllRules();

    // 3. Verify
    expect(rules).toHaveLength(2);
    const ids = rules.map(r => r.id.toString()).sort();
    expect(ids).toEqual(['agent1', 'agent2']);
  });
});
