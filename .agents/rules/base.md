---
trigger: always_on
---

Este proyecto tiene como objetivo ser una herramienta para pasar entre un IDE (editor de codigo), extenciones para vscode y TUI (herramienta de terminal) con herramientas de AI a otros, esto lo hara sincronnizando los archvios del direntorio de ese entorno, este directorio es una carpeta especial que me permite definirle un entorno a al Agente de AI ingregrado en el IDE.

Las herramientas conb las que partiremos seran.

IDE's: cursor, antigravity, vscode.

extenciones: kilocode, cline.

TUI's: opencode, claudecode.

como lo haremos:

cadauna de estas herramientas usa una directorio de configuracion el cual contiene un conjunto de carpetas y archivos.

| NOTA: este listado esta extraido del repositorio de github "https://github.com/vercel-labs/skills"

| Agent | `--agent` | Project Path | Global Path |
|-------|-----------|--------------|-------------|
| Amp, Kimi Code CLI, Replit | `amp`, `kimi-cli`, `replit` | `.agents/` | `~/.config/agents/` |
| Antigravity | `antigravity` | `.agent/` | `~/.gemini/antigravity/` |
| Augment | `augment` | `.augment/` | `~/.augment/` |
| Claude Code | `claude-code` | `.claude/` | `~/.claude/` |
| OpenClaw | `openclaw` | `` | `~/.moltbot/` |
| Cline | `cline` | `.cline/` | `~/.cline/` |
| CodeBuddy | `codebuddy` | `.codebuddy/` | `~/.codebuddy/` |
| Codex | `codex` | `.agents/` | `~/.codex/` |
| Command Code | `command-code` | `.commandcode/` | `~/.commandcode/` |
| Continue | `continue` | `.continue/` | `~/.continue/` |
| Crush | `crush` | `.crush/` | `~/.config/crush/` |
| Cursor | `cursor` | `.cursor/` | `~/.cursor/` |
| Droid | `droid` | `.factory/` | `~/.factory/` |
| Gemini CLI | `gemini-cli` | `.agents/` | `~/.gemini/` |
| GitHub Copilot | `github-copilot` | `.agents/` | `~/.copilot/` |
| Goose | `goose` | `.goose/` | `~/.config/goose/` |
| Junie | `junie` | `.junie/` | `~/.junie/` |
| iFlow CLI | `iflow-cli` | `.iflow/` | `~/.iflow/` |
| Kilo Code | `kilo` | `.kilocode/` | `~/.kilocode/` |
| Kiro CLI | `kiro-cli` | `.kiro/` | `~/.kiro/` |
| Kode | `kode` | `.kode/` | `~/.kode/` |
| MCPJam | `mcpjam` | `.mcpjam/` | `~/.mcpjam/` |
| Mistral Vibe | `mistral-vibe` | `.vibe/` | `~/.vibe/` |
| Mux | `mux` | `.mux/` | `~/.mux/` |
| OpenCode | `opencode` | `.agents/` | `~/.config/opencode/` |
| OpenHands | `openhands` | `.openhands/` | `~/.openhands/` |
| Pi | `pi` | `.pi/` | `~/.pi/agent/` |
| Qoder | `qoder` | `.qoder/` | `~/.qoder/` |
| Qwen Code | `qwen-code` | `.qwen/` | `~/.qwen/` |
| Roo Code | `roo` | `.roo/` | `~/.roo/` |
| Trae | `trae` | `.trae/` | `~/.trae/` |
| Trae CN | `trae-cn` | `.trae/` | `~/.trae-cn/` |
| Windsurf | `windsurf` | `.windsurf/` | `~/.codeium/windsurf/` |
| Zencoder | `zencoder` | `.zencoder/` | `~/.zencoder/` |
| Neovate | `neovate` | `.neovate/` | `~/.neovate/` |
| Pochi | `pochi` | `.pochi/` | `~/.pochi/` |
| AdaL | `adal` | `.adal/` | `~/.adal/` |


que partes tendra nuestro proyecto.

1. sera un monorepo de bun.js administrado con bunstart.
2. usaremos el directorio `./context` para manejar la persistencia de contexto local del proyecto durante el desarrollo.
3. definiremos el estándar `.agents/` como el **Puente Universal (Universal Bridge)** para la sincronización entre diferentes agentes de AI.
4. manejara arquitectura hexagonal de puertos y adaptadores.
5. crearemos un package que maneje el core del motor de sincronizacion de directorios.
6. tendremos dos apps para presentar esto 1. una extencion para vscode y 2. una cli.