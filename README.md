# DotAgents

Tool for **switching between IDEs, extensions, and TUIs with AI agents**: it syncs the configuration directory of each environment (the folder that defines the agent context in that IDE).

Flow: **source → `.agents/` (bridge) → target**. Example: `.cursor/` → `.agents/` → `.agent/` to go from Cursor to Antigravity. The file sync engine is the **diff** package (`packages/diff`).

## Goal

Sync configuration directories across:

- **IDEs:** Cursor, Antigravity, VSCode  
- **Extensions:** Kilo Code, Cline  
- **TUIs:** OpenCode, Claude Code  

Each tool has its own config directory layout; DotAgents uses `.agents/` as the intermediate format to move from one to another.

## How we do it

Each tool has a **Project Path** (in the repo) and optionally a **Global Path** (in the user’s home). Sync runs between that path and the `.agents/` bridge.

| NOTE: list extracted from [vercel-labs/skills](https://github.com/vercel-labs/skills) |

| Agent                      | `--agent`                   | Project Path    | Global Path              |
| -------------------------- | --------------------------- | --------------- | ------------------------ |
| Amp, Kimi Code CLI, Replit | `amp`, `kimi-cli`, `replit` | `.agents/`      | `~/.config/agents/`      |
| Antigravity                | `antigravity`               | `.agent/`       | `~/.gemini/antigravity/` |
| Augment                    | `augment`                   | `.augment/`     | `~/.augment/`            |
| Claude Code                | `claude-code`               | `.claude/`      | `~/.claude/`             |
| OpenClaw                   | `openclaw`                  | (empty)         | `~/.moltbot/`            |
| Cline                      | `cline`                     | `.cline/`       | `~/.cline/`               |
| CodeBuddy                  | `codebuddy`                 | `.codebuddy/`   | `~/.codebuddy/`          |
| Codex                      | `codex`                     | `.agents/`      | `~/.codex/`             |
| Command Code               | `command-code`              | `.commandcode/` | `~/.commandcode/`        |
| Continue                   | `continue`                  | `.continue/`    | `~/.continue/`           |
| Crush                      | `crush`                     | `.crush/`       | `~/.config/crush/`       |
| Cursor                     | `cursor`                    | `.cursor/`      | `~/.cursor/`             |
| Droid                      | `droid`                     | `.factory/`     | `~/.factory/`            |
| Gemini CLI                 | `gemini-cli`                | `.agents/`      | `~/.gemini/`             |
| GitHub Copilot             | `github-copilot`            | `.agents/`      | `~/.copilot/`            |
| Goose                      | `goose`                     | `.goose/`       | `~/.config/goose/`       |
| Junie                      | `junie`                     | `.junie/`       | `~/.junie/`              |
| iFlow CLI                  | `iflow-cli`                 | `.iflow/`       | `~/.iflow/`               |
| Kilo Code                  | `kilo`                      | `.kilocode/`    | `~/.kilocode/`           |
| Kiro CLI                   | `kiro-cli`                  | `.kiro/`        | `~/.kiro/`                |
| Kode                       | `kode`                      | `.kode/`        | `~/.kode/`                |
| MCPJam                     | `mcpjam`                    | `.mcpjam/`      | `~/.mcpjam/`             |
| Mistral Vibe               | `mistral-vibe`              | `.vibe/`        | `~/.vibe/`                |
| Mux                        | `mux`                       | `.mux/`         | `~/.mux/`                 |
| OpenCode                   | `opencode`                  | `.agents/`      | `~/.config/opencode/`    |
| OpenHands                  | `openhands`                 | `.openhands/`   | `~/.openhands/`          |
| Pi                         | `pi`                        | `.pi/`          | `~/.pi/agent/`            |
| Qoder                      | `qoder`                     | `.qoder/`       | `~/.qoder/`               |
| Qwen Code                  | `qwen-code`                 | `.qwen/`        | `~/.qwen/`                |
| Roo Code                   | `roo`                       | `.roo/`         | `~/.roo/`                 |
| Trae                       | `trae`                      | `.trae/`        | `~/.trae/`                |
| Trae CN                    | `trae-cn`                   | `.trae/`        | `~/.trae-cn/`            |
| Windsurf                   | `windsurf`                  | `.windsurf/`    | `~/.codeium/windsurf/`    |
| Zencoder                   | `zencoder`                  | `.zencoder/`    | `~/.zencoder/`           |
| Neovate                    | `neovate`                   | `.neovate/`     | `~/.neovate/`            |
| Pochi                      | `pochi`                     | `.pochi/`       | `~/.pochi/`               |
| AdaL                       | `adal`                      | `.adal/`        | `~/.adal/`                |

## Project structure

1. **Monorepo** on Bun.js, managed with [bunstart](https://github.com/bunstart).
2. **`./context`** — local project context persistence during development.
3. **`.agents/`** — **Universal Bridge** standard for syncing between AI agents; canonical layout (e.g. `rules/`, `skills/`, `mcp/`), not per-agent folders.
4. **Hexagonal architecture** — ports and adapters in the modules.
5. **`diff` package** — core directory sync engine (applies inbound/outbound rules between source and `.agents/`).
6. **Two applications:** VSCode extension and CLI.

## Development

```bash
bun install
```

See each app or package for run and test commands.
