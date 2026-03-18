# DotAgents Rule Creation Prompt

You are an AI development agent. We are setting up a universal sync system called **DotAgents**.

**Language:** This prompt and your response (including the capability table and any text) must be in **English**. All comments inside the generated YAML file must also be in **English** (e.g. `# [rules] Persistent instructions`, not in another language).

**Goal:** Produce a **YAML configuration file** (agent rule) that defines how to sync your tool’s rules, skills, commands, MCP config, and workflows with the universal bridge `.agents/`. Save this file at **`.agents/.ai/rules/<id>.yaml`** (e.g. `cursor.yaml`, `opencode.yaml`). Synced rule **documents** (e.g. `.md` from the IDE) live under `.agents/rules/`, not duplicate copies of this YAML.

## Step 1 — Declare which capabilities your tool supports

Before generating the YAML, identify which of the following **configuration categories** your tool supports. Only include mappings for categories that actually exist in your agent.

| Category | Description | Canonical path in `.agents/` | Creates rules? |
|---|---|---|---|
| **rules** | Persistent instructions that guide the agent (system prompts, project rules, coding standards). Applied always or by trigger/glob. | `.agents/rules/` | ✅ Yes — main sync unit |
| **skills** | Specialized capabilities activated on demand. Each skill is a folder with a `SKILL.md` defining a full workflow the agent runs when the user requests it. | `.agents/skills/` | ❌ No — capabilities, not behavior constraints |
| **workflows** | Reusable commands or actions the user invokes explicitly (slash commands, task runners, parameterized prompts). | `.agents/workflows/` | ❌ No — action triggers, not rules |
| **agents** | Subordinate agent definitions with their own personality, permissions, and scope (sub-agents, custom agent modes). | `.agents/agents/` | ❌ No — orchestration, not rules |
| **agent-file** | Single instruction file at project root (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.clinerules`, etc.). | `.agents/rules/<id>-agent.md` | ✅ Yes — equivalent to a global project rule |
| **mcp** | MCP server config (Model Context Protocol): `mcp.json`, `.mcp.json`, or a settings section. The bridge has **one canonical list** (e.g. `mcp/mcp.json`); all tools sync with that list, not one file per agent. | `.agents/mcp/` (single file, e.g. `mcp.json`) | ❌ No (external tool config) |
| **docs** | Reference documentation the agent uses (not behavior instructions). | `.agents/docs/` | ❌ No (context, not behavior) |
| **custom** | Any other tool-specific config to be carried into the bridge (e.g. snippets, templates, personas). | `.agents/<category>/` | Depends on content |

---

### How to tell rules, skills, and workflows apart

These three categories are the most easily confused. Use this guide to classify correctly:

| | **Rules** | **Skills** | **Workflows** |
|---|---|---|---|
| **Purpose** | Guide or constrain the agent’s general behavior | Provide a specialized, on-demand capability | Define an invocable action the user triggers |
| **Activation** | Always on, or by automatic trigger/glob | When the user asks for something that matches the skill’s `description` | When the user invokes an explicit command (e.g. `/planning`) |
| **Persistence** | For the whole session | Only while the skill runs | Only for the duration of the command |
| **Contains** | Constraints, standards, conventions | Full workflow: when to use, internal rules, steps, output format | Parameterized prompt or sequence of steps |
| **Typical format** | `.mdc`, `.md` with frontmatter (`alwaysApply`, `globs`) | Folder with `SKILL.md` (frontmatter `name`, `description`) | `.md` with frontmatter (`description`, optionally `trigger`) |
| **Example** | “Use Bun instead of Node” | “Write TDD tests before implementing” | `/planning` — generate a plan from a sprint |
| **Path in `.agents/`** | `rules/` | `skills/<name>/SKILL.md` | `workflows/` |

> **Golden rule:** Treat as **rules** those files whose purpose is to instruct/constrain/guide the AI agent’s behavior at all times or by an automatic pattern. If the file defines an **invocable capability** with its own workflow, it’s a **skill**. If it defines a **command or action** the user triggers explicitly, it’s a **workflow**.

**Quick classification tests:**

1. Does it apply automatically without the user asking? → **Rule**
2. Does the agent activate it when the task matches? → **Skill**
3. Does the user invoke it with an explicit command (e.g. `/command`)? → **Workflow**
4. Does it configure an external tool (MCP, linter, etc.)? → **Neither rule nor skill nor workflow** (it’s `mcp` or `config`)

---

## Step 2 — Instructions for generating the YAML

If the repo already has agent rule YAML in `.agents/.ai/rules/` (or legacy copies under `rules/`), use them as a reference for format and mappings.

1. Identify your agent ID (e.g. `cursor`, `claude-code`, `antigravity`, `cline`) and name.
2. Define UI fields under `ui` (icon, color, description).
3. Identify your config paths: in the workspace (project folder or files) and, if any, in home (global config, relative to `$HOME`).
4. Generate a YAML file using the schema with `paths` (see below). Each `paths` entry has:
   - **path**: relative path (to workspace or to `$HOME` depending on `scope`).
   - **scope**: `"workspace"` (project root) or `"home"` (relative to `$HOME`, no `~`).
   - **type**: `"file"` or `"directory"`.
   - **purpose**: `"marker"` (agent detection), `"sync_source"` (sync source/target), `"config"` (global config).
5. Define `inbound` (from your tool to `.agents/`) and `outbound` (from `.agents/` to your tool). **Include only the categories your tool supports** from Step 1.
6. If you use file extensions other than `.md` (e.g. `.mdc`), use `source_ext` and `target_ext` in the `directory` mapping for automatic conversion.
7. If you need to extract specific data from JSON (e.g. config keys), use `extract` (JSONPath) and `format: json-transform` or `json-split`.
8. If your agent stores rules in `.md` but the standard or another tool expects JSON, use content conversion: `format: md-json` (inbound) and `format: json-md` (outbound), with the standard schema `{ "content": "<markdown>", "description": "optional" }` (see `context/pkg/rule/doc/rule.md`).
9. If your tool uses a **single instruction file** at root (`AGENTS.md`, `CLAUDE.md`, etc.), map it as a `file` with `format: "file"` to `.agents/rules/<id>-agent.md`.
10. Map your tool’s **commands / slash commands** to `workflows/` in the bridge. The native command folder name may differ (e.g. Cursor uses `commands/`, Claude Code might use `tasks/`).
11. If your tool supports **sub-agents** or **custom agent modes**, map them to `agents/` in the bridge.
12. **MCP:** If your tool has MCP config, always map it to the bridge’s **single list**: `mcp/mcp.json`. Inbound: from your native file (e.g. `mcp.json`, or `$.mcp` in a JSON) to `mcp/mcp.json`. Outbound: from `mcp/mcp.json` to your native format. **Do not** create per-agent files (`mcp/cursor-mcp.json`, etc.).

## Base schema with paths, extensions, and transformations

All comments in the generated YAML must be in English.

```yaml
version: "1.0"
agent:
  id: "YOUR_ID"
  name: "YOUR_NAME"
  ui:
    icon: "gear"      # VSCode Codicon ID or emoji
    color: "#3498db"  # Main hex color
    description: "Short description for lists and tooltips"

paths:
  - path: "YOUR_WORKSPACE_PATH"   # e.g. ".cursor/" or "rules.md"
    scope: "workspace"
    type: "directory"             # or "file" for single files
    purpose: "marker"              # or "sync_source"
  - path: "YOUR_HOME_PATH"        # e.g. ".cursor" or ".gemini/antigravity"
    scope: "home"
    type: "directory"
    purpose: "config"

mapping:
  inbound:
    # [rules] ✅ Persistent instructions → synced as rules
    - from: "rules/"
      to: "rules/"
      format: "directory"
      source_ext: ".YOUR_EXT"     # (Optional) e.g. ".mdc" (include the dot)
      target_ext: ".md"           # (Optional) conversion into the bridge

    # [agent-file] ✅ Single root instruction file → global rule
    # Uncomment if your tool uses a file like AGENTS.md, CLAUDE.md, GEMINI.md, etc.
    # - from: "AGENTS.md"
    #   to: "rules/YOUR_ID-agent.md"
    #   format: "file"

    # [skills] Specialized capabilities (folders with SKILL.md)
    - from: "skills/"
      to: "skills/"
      format: "directory"

    # [workflows] User-invocable commands (slash commands, task prompts)
    - from: "YOUR_COMMANDS_FOLDER/"  # e.g. "commands/" in Cursor, "tasks/" elsewhere
      to: "workflows/"
      format: "directory"

    # [agents] Sub-agent or custom agent mode definitions
    # Uncomment if your tool supports sub-agents
    # - from: "agents/"
    #   to: "agents/"
    #   format: "directory"

    # [mcp] External tool config (single list in the bridge)
    # All tools read/write the same canonical file; do not create mcp/<id>-mcp.json
    # - from: "mcp.json"
    #   to: "mcp/mcp.json"
    #   format: "json-transform"
    #   extract: "$.mcpServers"

    # [docs] Reference context, not rules
    # - from: "docs/"
    #   to: "docs/"
    #   format: "directory"

    # Advanced JSON example
    # - from: "config.json"
    #   to: "config-subset.json"
    #   format: "json-transform"
    #   extract: "$.key.subkey"     # Optional JSONPath
    #   adapter: "agent-mdc"        # Optional adapter

  outbound:
    # [rules] ✅
    - from: "rules/"
      to: "rules/"
      format: "directory"
      source_ext: ".md"           # (Optional if you used target_ext above)
      target_ext: ".YOUR_EXT"     # (Optional if you used source_ext above) e.g. ".mdc"

    # [agent-file] ✅
    # - from: "rules/YOUR_ID-agent.md"
    #   to: "AGENTS.md"
    #   format: "file"

    # [skills]
    - from: "skills/"
      to: "skills/"
      format: "directory"

    # [workflows]
    - from: "workflows/"
      to: "YOUR_COMMANDS_FOLDER/"  # e.g. "commands/" in Cursor
      format: "directory"

    # [agents]
    # - from: "agents/"
    #   to: "agents/"
    #   format: "directory"

    # [mcp] Single bridge list → tool’s native format
    # - from: "mcp/mcp.json"
    #   to: "mcp.json"
    #   format: "json-transform"
    #   extract: "$.mcpServers"

target_standard: ".agents/"
```

## Examples by agent type

### 1. Single folder (same name in workspace and home)

Example: Cursor (`.cursor/` in project, `.cursor` in home). *(Remember to include the full agent and mapping blocks.)*

```yaml
paths:
  - path: ".cursor/"
    scope: "workspace"
    type: "directory"
    purpose: "marker"
  - path: ".cursor"
    scope: "home"
    type: "directory"
    purpose: "config"
```

### 2. Different paths (different names in workspace vs home)

Example: Antigravity (`.agent/` in project, `.gemini/antigravity` in home).

```yaml
paths:
  - path: ".agent/"
    scope: "workspace"
    type: "directory"
    purpose: "marker"
  - path: ".gemini/antigravity"
    scope: "home"
    type: "directory"
    purpose: "config"
```

### 3. Loose files at project root

Example: agent that uses root-level files (e.g. `rules.md`, `prompts.md`) instead of a folder.

```yaml
paths:
  - path: "rules.md"
    scope: "workspace"
    type: "file"
    purpose: "marker"
  - path: "prompts.md"
    scope: "workspace"
    type: "file"
    purpose: "sync_source"
  - path: ".myagent"
    scope: "home"
    type: "directory"
    purpose: "config"
```

### 4. Single root instruction file (agent-file)

Example: Claude Code (`CLAUDE.md`), OpenCode (`AGENTS.md`), Gemini (`GEMINI.md`), Cline (`.clinerules`). This pattern **creates a rule** at `.agents/rules/<id>-agent.md`.

```yaml
paths:
  - path: "CLAUDE.md"
    scope: "workspace"
    type: "file"
    purpose: "marker"

mapping:
  inbound:
    - from: "CLAUDE.md"
      to: "rules/claude-agent.md"
      format: "file"
  outbound:
    - from: "rules/claude-agent.md"
      to: "CLAUDE.md"
      format: "file"
```

### 5. Commands / Slash commands (workflows)

Example: Cursor uses `.cursor/commands/` for slash commands; they sync as `workflows/` in the bridge.

```yaml
mapping:
  inbound:
    - from: "commands/"
      to: "workflows/"
      format: "directory"
  outbound:
    - from: "workflows/"
      to: "commands/"
      format: "directory"
```

Each file in `commands/` is a `.md` with frontmatter (`description`) defining a reusable prompt. When syncing to the bridge they are copied as-is to `.agents/workflows/`. Another tool that supports workflows can read them and adapt to its native command format.

### 6. Skills (specialized capabilities)

Example: Cursor uses `.cursor/skills/<name>/SKILL.md`; they sync as `skills/` in the bridge.

```yaml
mapping:
  inbound:
    - from: "skills/"
      to: "skills/"
      format: "directory"
  outbound:
    - from: "skills/"
      to: "skills/"
      format: "directory"
```

Each skill is a **folder** with at least a `SKILL.md` containing: frontmatter with `name` and `description` (for auto-activation), and a full workflow (when to use, internal rules, steps, output format). Unlike a **rule**, a skill is not applied automatically: the agent activates it when the user’s task matches its `description`.

### 7. Sub-agents / Custom agent modes (agents)

Example: Cursor supports `.cursor/agents/` for custom agent modes.

```yaml
mapping:
  inbound:
    - from: "agents/"
      to: "agents/"
      format: "directory"
  outbound:
    - from: "agents/"
      to: "agents/"
      format: "directory"
```

Each sub-agent has a **distinct personality** with its own scope, permissions, and constraints. Unlike a workflow (a one-off action), a sub-agent keeps its context for the whole session.

### 8. MCP configuration (mcp)

In `.agents/` there is **one MCP list** (e.g. `mcp/mcp.json`). All tools sync with that list: inbound from native format to the canonical file, outbound from the canonical file to native format. **Do not** create one file per agent (`mcp/cursor-mcp.json`, `mcp/opencode-mcp.json`, etc.). This pattern **does not create rules**; it only carries tool configuration.

```yaml
mapping:
  inbound:
    - from: "mcp.json"
      to: "mcp/mcp.json"
      format: "json-transform"
      extract: "$.mcpServers"
  outbound:
    - from: "mcp/mcp.json"
      to: "mcp.json"
      format: "json-transform"
      extract: "$.mcpServers"
```

### 9. Advanced JSON transformation (custom)

Example: extract specific config from an arbitrary JSON.

```yaml
mapping:
  inbound:
    - from: "config.json"
      to: "config-subset.json"
      format: "json-transform"
      extract: "$.key.subkey"
```

---

## Expected response

Respond with **two sections**:

1. **Capability table**  
   List the Step 1 categories your tool supports, with native path and whether it creates rules (✅/❌/⚠️).

2. **Full YAML block**  
   The configuration file ready to save. The filename must be **`<id>.yaml`** under **`.agents/.ai/rules/`** (e.g. if `agent.id` is `cursor`, the file is `.agents/.ai/rules/cursor.yaml`). **All comments in the YAML must be in English.**

**Pre-submit checklist:**

- [ ] Inbound and outbound defined for each category the tool supports (symmetry).
- [ ] MCP, if applicable: single target/source `mcp/mcp.json`; no `mcp/<id>-mcp.json`.
- [ ] `paths` with correct `scope` (`workspace` vs `home`) and `purpose` (`marker`, `sync_source`, `config`).
- [ ] File extensions: if the tool uses `.mdc` or something other than `.md`, use `source_ext`/`target_ext` in `rules/` mappings.
- [ ] `target_standard: ".agents/"` at the end of the YAML.
- [ ] All comments in the generated YAML are in English.
