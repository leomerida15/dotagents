# AI Agent Synchronization Meta-Standard (@dotai/diff)

This document defines the technical protocol for creating synchronization rules. It is designed to be utilized as an **Agent Skill**, enabling AI IDEs and CLI tools to automatically generate and maintain their own mapping rules to integrate with the `.ai` universal bridge.

## 1. Sync Rule Specification (YAML)

Every AI agent must have a configuration file in **YAML** format. This allows any AI Agent to programmatically read, update, or create new mapping rules.

### Rule Schema (`rules/agents/{agent}.yaml`)

```yaml
version: "1.0"
agent:
  id: "agent-unique-id" # e.g., cursor, claudecode, antigravity, cline
  name: "Human Readable Name"

# The relative base path where the agent stores its local settings
source_root: ".agent-folder/" # Use "." if files are at the project root

# Bidirectional Flow Definition
mapping:
  # INBOUND: From Agent to Universal .ai Bridge
  inbound:
    - from: "instructions.txt"
      to: "rules/core.md"
      format: "markdown"
    - from: "custom_skills/"
      to: "skills/"
      format: "directory"
    - from: "config.json"
      to: "mcp/settings.json"
      format: "json"

  # OUTBOUND: From Universal .ai Bridge to Agent
  outbound:
    - from: "rules/core.md"
      to: "instructions.txt"
    - from: "skills/"
      to: "custom_skills/"
    - from: "mcp/settings.json"
      to: "config.json"

# Universal storage folder target
target_standard: ".ai/"
```

## 2. Universal Bridge Structure (.ai)

The `.ai/` directory acts as the **Source of Truth**. To ensure cross-tool compatibility, agents MUST adhere to this internal layout:

- `.ai/rules/`: Master instruction sets and prompts (`.md`).
- `.ai/skills/`: Reusable scripts, tools, and executable skills.
- `.ai/mcp/`: Model Context Protocol configurations.
- `.ai/sync.json`: The synchronization manifest (heartbeat).

## 3. State Management (Atomic Timestamps)

A numeric timestamp system is used in `.ai/sync.json` to manage state, resolve conflicts, and determine the latest version of the configuration.

### `sync.json` Schema

```json
{
  "last_processed_at": 1739294215000,
  "last_active_agent": "cursor",
  "agents": {
    "ai": 1739294215000,
    "cursor": 1739294215000,
    "antigravity": 1739294000000
  }
}
```

### Synchronization Algorithm:

1. **Detection**: When a file in an agent's path (e.g., `.cursorrules`) is modified, the `@dotai` engine calculates a new high-precision `timestamp`.
2. **Inbound Push**: The modified data is mapped to the `.ai/` bridge using the `inbound` rules.
3. **Heartbeat Update**: The `sync.json` is updated: `agents.{current_agent} = Date.now()` and `agents.ai = agents.{current_agent}`.
4. **Outbound Pull**: When a different tool (e.g., Antigravity) is activated, the engine checks if `agents.ai > agents.antigravity`. If true, it executes the `outbound` mapping from `.ai/` to the tool's local path.

## 4. Agent Skill: Rule Generation Protocol

When an AI Agent is tasked with "adding support for a new tool", it MUST follow these steps:

1. **Locate**: Identify the configuration paths (local project folder and global config folder) of the target tool.
2. **Standardize**: Map those paths to the nearest equivalent in the `.ai/` standard (rules, skills, mcp).
3. **Verify Reversibility**: Ensure the `inbound` transformation can be losslessly reversed via the `outbound` rules.
4. **Generate**: Output the final YAML configuration following the schema in Section 1.
