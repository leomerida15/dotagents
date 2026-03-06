import * as yaml from 'js-yaml';
import type { IInstalledRuleRepository } from '../../app';
import { join } from 'node:path';
import { AgentID, InstalledRule } from '../../domain';
import { accessSync, readFileSync, readdirSync } from 'node:fs';
import { YamlMapper } from 'src/utils/infra';
import { RuleSourceType } from 'src/utils/domain';

/**
 * Properties for configuring the FsInstalledRuleRepository.
 */
export interface FsInstalledRuleRepositoryProps {
	basePath?: string;
}

/**
 * Filesystem-based implementation of IInstalledRuleRepository.
 * Reads rule YAML files from the filesystem.
 */
export class FsInstalledRuleRepository implements IInstalledRuleRepository {
	private readonly basePath: string;

	/**
	 * Creates a filesystem repository for installed YAML rules.
	 *
	 * @param props - Optional base path where rule files are stored
	 */
	constructor({ basePath }: FsInstalledRuleRepositoryProps = {}) {
		this.basePath = basePath ?? join(process.cwd(), '.agents', 'rules');
	}

	/**
	 * Checks if a rule file exists for the given agent ID.
	 * @param agentId - The ID of the agent.
	 * @returns True if the rule exists, false otherwise.
	 */
	/**
	 * Checks if a rule file exists for the given agent ID.
	 * @param agentId - The ID of the agent.
	 * @returns True if the rule exists, false otherwise.
	 */
	existsRule(agentId: AgentID): boolean {
		const filePath = join(this.basePath, `${agentId.toString()}.yaml`);
		try {
			accessSync(filePath);
			return true;
		} catch (error) {
			return false;
		}
	}

	/**
	 * Gets the rule for a specific agent ID.
	 * @param agentId - The ID of the agent.
	 * @returns The installed rule or null if not found.
	 */
	/**
	 * Gets the rule for a specific agent ID.
	 * @param agentId - The ID of the agent.
	 * @returns The installed rule or null if not found.
	 */
	getRule(agentId: AgentID): InstalledRule | null {
		const filePath = join(this.basePath, `${agentId.toString()}.yaml`);

		try {
			accessSync(filePath);
			const content = readFileSync(filePath, 'utf8');
			const parsed = yaml.load(content);

			// YamlMapper returns ParsedRuleData, convert to InstalledRule
			const ruleData = YamlMapper.toDomain(parsed, {
				type: RuleSourceType.LOCAL,
				location: filePath,
			});

			return new InstalledRule({
				id: ruleData.id,
				name: ruleData.name,
				sourceRoot: ruleData.sourceRoot,
				inbound: ruleData.inbound,
				outbound: ruleData.outbound,
			});
		} catch (error) {
			return null;
		}
	}

	/**
	 * Gets all installed rules from the filesystem.
	 * @returns Array of installed rules.
	 */
	/**
	 * Gets all installed rules from the filesystem.
	 * @returns Array of installed rules.
	 */
	getAllRules(): InstalledRule[] {
		try {
			const files = readdirSync(this.basePath);
			const yamlFiles = files.filter((fileName) => fileName.endsWith('.yaml'));

			const rules: InstalledRule[] = [];

			for (const file of yamlFiles) {
				const agentId = file.replace('.yaml', '');
				try {
					const rule = this.getRule(new AgentID(agentId));
					if (rule) {
						rules.push(rule);
					}
				} catch (error) {
					console.warn(`Skipping invalid agent ID in file: ${file}`, error);
				}
			}

			return rules;
		} catch (error) {
			// Directory doesn't exist or can't be read
			console.warn(`Could not read rules directory ${this.basePath}:`, error);
			return [];
		}
	}
}
