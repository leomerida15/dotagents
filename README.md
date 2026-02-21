# DotAgents

Herramienta para **pasar entre IDEs, extensiones y TUIs con agentes de IA**: sincroniza los archivos del directorio de configuración de cada entorno (la carpeta que define el contexto del agente en ese IDE).

Flujo: **origen → `.agents/` (puente) → destino**. Ejemplo: `.cursor/` → `.agents/` → `.agent/` para ir de Cursor a Antigravity. El motor de sincronización de archivos es el paquete **diff** (`packages/diff`).

## Objetivo

Sincronizar los directorios de configuración entre:

- **IDEs:** Cursor, Antigravity, VSCode  
- **Extensiones:** Kilo Code, Cline  
- **TUIs:** OpenCode, Claude Code  

Cada herramienta usa un directorio de configuración con carpetas y archivos propios; DotAgents usa `.agents/` como formato intermedio para pasar de uno a otro.

## Cómo lo hacemos

Cada herramienta tiene un **Project Path** (en el repo) y opcionalmente un **Global Path** (en el usuario). La sincronización se hace entre ese path y el puente `.agents/`.

| NOTA: listado extraído de [vercel-labs/skills](https://github.com/vercel-labs/skills) |

| Agent                      | `--agent`                   | Project Path    | Global Path              |
| -------------------------- | --------------------------- | --------------- | ------------------------ |
| Amp, Kimi Code CLI, Replit | `amp`, `kimi-cli`, `replit` | `.agents/`      | `~/.config/agents/`      |
| Antigravity                | `antigravity`               | `.agent/`       | `~/.gemini/antigravity/` |
| Augment                    | `augment`                   | `.augment/`     | `~/.augment/`            |
| Claude Code                | `claude-code`               | `.claude/`      | `~/.claude/`             |
| OpenClaw                   | `openclaw`                  | (vacío)         | `~/.moltbot/`            |
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

## Partes del proyecto

1. **Monorepo** en Bun.js, administrado con [bunstart](https://github.com/bunstart).
2. **`./context`** — persistencia de contexto local del proyecto durante el desarrollo.
3. **`.agents/`** — estándar **Puente Universal (Universal Bridge)** para sincronización entre agentes de IA; tiene su propio formato canónico (p. ej. `rules/`, `skills/`, `mcp/`), no carpetas por agente.
4. **Arquitectura hexagonal** — puertos y adaptadores en los módulos.
5. **Package `diff`** — core del motor de sincronización de directorios (aplica reglas inbound/outbound entre origen y `.agents/`).
6. **Dos aplicaciones:** extensión para VSCode y CLI.

## Desarrollo

```bash
bun install
```

Ver cada app o package para comandos de ejecución y tests.
