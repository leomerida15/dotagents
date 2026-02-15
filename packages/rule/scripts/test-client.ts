import { ClientModule } from '../src/mods/client/ClientModule';
import { GetterModule } from '../src/mods/getter/GetterModule';

console.log('🚀 Starting Client Module Smoke Test...');

try {
	// 1. First, use getter to create a test rule
	console.log('📝 Step 1: Creating test rule with Getter...');

	process.env.DOTAGENTS_RULE_SOURCE = 'LOCAL';
	process.env.DOTAGENTS_LOCAL_PATH = './test-rules';

	const testAgentId = 'test-client-agent';
	const testRuleContent = `agent:
  id: "${testAgentId}"
  name: "Test Client Agent"
  source_root: "."
  mapping:
    inbound:
      - from: "src"
        to: "dest"
        format: "yaml"
    outbound:
      - from: "out"
        to: "result"
`;

	await Bun.write(`./test-rules/${testAgentId}.yaml`, testRuleContent);

	const getterUseCase = GetterModule.createGetAgentRuleUseCase();
	await getterUseCase.execute({ agentId: testAgentId });

	console.log('✅ Test rule created and persisted to .agents/.ai/');

	// 2. Now test the client module
	console.log('\n🔍 Step 2: Testing Client Module...');

	const listUseCase = ClientModule.createListInstalledRulesUseCase();
	const getUseCase = ClientModule.createGetInstalledRuleUseCase();

	// Test listing all rules
	console.log('📋 Listing all installed rules...');
	const allRules = await listUseCase.execute();
	console.log(`✅ Found ${allRules.length} installed rule(s)`);

	if (allRules.length === 0) {
		console.error('❌ Expected at least 1 rule, but found none');
		process.exit(1);
	}

	// Test getting specific rule
	console.log(`\n🔎 Getting specific rule: ${testAgentId}...`);
	const rule = await getUseCase.execute(testAgentId);

	if (!rule) {
		console.error(`❌ Failed to retrieve rule for ${testAgentId}`);
		process.exit(1);
	}

	console.log('✅ Rule retrieved successfully:');
	console.log(JSON.stringify(rule, null, 2));

	// Verify rule structure
	if (rule.id !== testAgentId) {
		console.error(`❌ Expected id '${testAgentId}', got '${rule.id}'`);
		process.exit(1);
	}

	if (!rule.mappings.inbound || rule.mappings.inbound.length === 0) {
		console.error('❌ Expected inbound mappings');
		process.exit(1);
	}

	console.log('\n✅ All Client Module tests passed!');
} catch (error) {
	console.error('❌ Client Module Smoke Test Failed:', error);
	process.exit(1);
} finally {
	// Cleanup
	console.log('\n🧹 Cleaning up...');
	try {
		await Bun.$`rm -rf ./test-rules .agents`;
		console.log('✅ Cleanup complete');
	} catch (e) {
		console.warn('⚠️  Cleanup warning:', e);
	}
}
