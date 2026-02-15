import { GetterModule } from '../src/mods/getter/GetterModule';

async function main() {
	console.log('🚀 Starting Getter Module Smoke Test...');

	// 1. Setup Environment
	// We will simulate a Local rule source for safety
	process.env.DOTAGENTS_RULE_SOURCE = 'LOCAL';
	process.env.DOTAGENTS_LOCAL_PATH = './test-rules';

	// Create a dummy rule file for testing
	const testAgentId = 'test-agent-001';
	const testRuleContent = `
agent:
  id: "${testAgentId}"
  name: "Test Agent"
  source_root: "."
  mapping:
    inbound:
      - from: "source"
        to: "dest"
    outbound: []
`;

	// Ensure test directory exists
	await Bun.write(`./test-rules/${testAgentId}.yaml`, testRuleContent);
	console.log(`✅ Created test rule at ./test-rules/${testAgentId}.yaml`);

	try {
		// 2. Instantiate Module
		const useCase = GetterModule.createGetAgentRuleUseCase();

		// 3. Execute Use Case
		console.log(`🔍 Fetching rule for agent: ${testAgentId}...`);
		const result = await useCase.execute({ agentId: testAgentId });

		console.log('✅ Rule Fetched Successfully:');
		console.log(JSON.stringify(result, null, 2));

		// 4. Verify Persistence
		const persistedPath = `.agents/.ai/${testAgentId}.yaml`;
		const persistedFile = Bun.file(persistedPath);

		if (await persistedFile.exists()) {
			console.log(`✅ Verified persistence at: ${persistedPath}`);
		} else {
			console.error(`❌ Persistence failed: File not found at ${persistedPath}`);
			process.exit(1);
		}
	} catch (error) {
		console.error('❌ Smoke Test Failed:', error);
		process.exit(1);
	} finally {
		// Cleanup
		console.log('🧹 Cleaning up...');
		// await Bun.spawn(["rm", "-rf", "./test-rules", ".agents"]).exited;
	}
}

main();
