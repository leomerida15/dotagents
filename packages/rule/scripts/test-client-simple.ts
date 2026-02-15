console.log('Test 1: Import modules');
import { ClientModule } from '../src/mods/client/ClientModule';
console.log('✅ ClientModule imported');

console.log('Test 2: Create use case');
const listUseCase = ClientModule.createListInstalledRulesUseCase();
console.log('✅ ListInstalledRulesUseCase created');

console.log('Test 3: Execute (should return empty array if no rules)');
const rules = await listUseCase.execute();
console.log(`✅ Got ${rules.length} rules`);

console.log('\n✅ All basic tests passed!');
