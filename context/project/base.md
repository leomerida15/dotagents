# DotAgents project base and concept

## Goal

Tool for **switching between an IDE, VSCode extensions, and TUIs with AI agents**. It does this by **syncing the configuration directory** of each environment: that folder defines the agent context in that IDE.

## Sync flow

**source → `.agents/` (bridge) → target**

Example: `.cursor/` → `.agents/` → `.agent/` to go from Cursor to Antigravity.  
The file sync engine is the **diff** package (`packages/diff`).

## Tools we support

- **IDEs:** cursor, antigravity, vscode  
- **Extensions:** kilocode, cline  
- **TUIs:** opencode, claudecode  

## How we do it

Each tool has a **configuration directory** with its own set of folders and files. DotAgents uses `.agents/` as the **single intermediate format** (universal bridge); we do not create per-agent subfolders inside `.agents/`.

Agent list (Project Path / Global Path) extracted from [vercel-labs/skills](https://github.com/vercel-labs/skills): see table in repo [README.md](../../README.md).

## Project structure

1. **Monorepo** on Bun.js, managed with bunstart.  
2. **`./context`** — local project context persistence during development.  
3. **`.agents/`** — **Universal Bridge** standard for syncing between AI agents (canonical layout: `rules/`, `skills/`, `mcp/`, etc.).  
4. **Hexagonal architecture** (ports and adapters).  
5. **`diff` package** — core directory sync engine.  
6. **Two apps:** VSCode extension and CLI.  

## References

- Project Cursor rule: `.cursor/rules/base.mdc`  
- Repo README: monorepo root  
