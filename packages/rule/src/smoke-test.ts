import { GetterModule } from './mods/getter/GetterModule';
import { AgentID } from './utils/domain/value-objects/AgentId';

async function testFetch() {
    console.log('--- Testing Rule Fetch from GitHub ---');

    // Set environment variable to force GitHub source
    process.env.DOTAGENTS_RULE_SOURCE = 'GITHUB';

    const useCase = GetterModule.createGetAgentRuleUseCase();
    const agentIdStr = 'antigravity';
    console.log(`Fetching rule for: ${agentIdStr}...`);

    try {
        const rule = await useCase.execute({ agentId: agentIdStr });

        if (rule) {
            console.log('✅ Rule fetched successfully!');
            console.log('Agent ID:', rule.id);
            console.log('Source:', rule.source.location);
            console.log('Inbound Mappings:', JSON.stringify(rule.inbound, null, 2));
        } else {
            console.log('❌ Rule not found.');
        }
    } catch (error) {
        console.error('❌ Error during fetch:', error);
    }
}

testFetch();
