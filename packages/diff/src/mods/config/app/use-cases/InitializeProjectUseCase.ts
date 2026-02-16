import { Configuration } from '../../domain/entities/Configuration';
import { SyncManifest } from '../../domain/entities/SyncManifest';
import type { IAgentScanner } from '../../domain/ports/IAgentScanner';
import type { IConfigRepository } from '../../domain/ports/IConfigRepository';
import type { IRuleProvider } from '../../domain/ports/IRuleProvider';
import { InitializeProjectSchema, type InitializeProjectDTO } from '../dto/InitializeProject.dto';
import { RuleFetchException } from '../exceptions/ConfigExceptions';

interface InitializeProjectUseCaseProps {
	ruleProvider: IRuleProvider;
	agentScanner: IAgentScanner;
	configRepository: IConfigRepository;
}

export class InitializeProjectUseCase {
	private readonly ruleProvider: IRuleProvider;
	private readonly agentScanner: IAgentScanner;
	private readonly configRepository: IConfigRepository;

	constructor({ ruleProvider, agentScanner, configRepository }: InitializeProjectUseCaseProps) {
		this.ruleProvider = ruleProvider;
		this.agentScanner = agentScanner;
		this.configRepository = configRepository;
	}

	/**
	 * Initializes the .agents folder and detects existing agents.
	 * @param input - The initialization data.
	 */
	public async execute(input: InitializeProjectDTO): Promise<Configuration> {
		const { workspaceRoot } = InitializeProjectSchema.parse(input);

		let detectedAgents;
		try {
			detectedAgents = await this.agentScanner.detectAgents(workspaceRoot);
		} catch (e: any) {
			throw new Error(`Agent detection failed: ${e.message}`);
		}

		// 3. Create initial sync manifest
		const manifest = SyncManifest.createEmpty();

		// Register detected agents in manifest
		for (const agent of detectedAgents) {
			manifest.registerAgent(agent.id);
		}

		// 4. Create Configuration Aggregate
		const config = Configuration.create({
			workspaceRoot,
			agents: detectedAgents,
			manifest,
		});

		// 5. Save the configuration (this will create .agents/state.json)
		await this.configRepository.save(config);

		return config;
	}
}
