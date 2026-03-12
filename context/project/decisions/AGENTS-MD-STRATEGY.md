# AGENTS.md Strategy - Placement and Sync Patterns

**Date**: 2026-03-08  
**Status**: Recommendation  
**Context**: How to handle AGENTS.md and similar agent instruction files across multiple AI tools

---

## Current Situation

### What We Have

1. **AGENTS.md in root** (`/var/home/snor/Documents/libs/dotagents/AGENTS.md`)
   - Contains build/test commands, code style, architecture guidelines
   - Read by the IDE/TUI when starting the agent session
   - **NOT currently synced** through the diff package mappings

2. **Agent-specific rules in `.agents/rules/`**
   - Multiple `.md` files (base.md, code.md, workspace.md, etc.)
   - Synced bidirectionally with tool-specific directories (e.g., `.cursor/rules/`, `.opencode/rules/`)

3. **Tool-specific config directories**
   - `.cursor/` - uses `.mdc` files in `rules/`
   - `.opencode/` - uses `.md` files in `rules/`
   - `.agent/` (Antigravity) - uses `.md` files in `rules/`

### What the System Supports (But Doesn't Currently Use)

The `diff` package **DOES support** the `agent-file` pattern for single instruction files:

```yaml
# Example: Claude Code pattern
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

**Known single-file patterns:**
- Claude Code → `CLAUDE.md`
- Gemini/Antigravity → `GEMINI.md`
- OpenCode → `AGENTS.md`
- Cline → `.clinerules`

---

## Problem Analysis

### Question 1: Where Should AGENTS.md Live?

**Option A: Root only (current)**
- ✅ Simple, single source of truth
- ✅ Detected automatically by IDE/TUI
- ❌ Not portable across agents without manual copy
- ❌ Each agent would need its own file (CLAUDE.md, GEMINI.md, etc.)

**Option B: Root + synced to `.agents/rules/<id>-agent.md`**
- ✅ Portable via the universal bridge
- ✅ Each tool gets its native file name
- ✅ Maintains single source in `.agents/`
- ⚠️ Need to choose which is canonical source

**Option C: Only in `.agents/rules/` (no root file)**
- ❌ IDE/TUI won't detect it automatically
- ❌ Breaks convention of root instruction files

**Recommendation: Option B** - Keep AGENTS.md in root AND sync it through the bridge

### Question 2: Does the diff Package Support Migration?

**YES!** The system already supports this via the `agent-file` mapping pattern.

Example for OpenCode:

```yaml
# Add to rules/opencode.yaml
mapping:
  inbound:
    - from: "AGENTS.md"
      to: "rules/opencode-agent.md"
      format: "file"
  outbound:
    - from: "rules/opencode-agent.md"
      to: "AGENTS.md"
      format: "file"
```

When syncing from OpenCode → Cursor, the flow would be:
```
AGENTS.md → .agents/rules/opencode-agent.md → .agents/rules/cursor-agent.md → CURSOR.md
```

---

## Proposed Strategy

### 1. Universal Naming Convention

**In `.agents/` (Universal Bridge):**
- All single instruction files map to: `.agents/rules/<agent-id>-agent.md`
- Examples:
  - `cursor-agent.md` (from Cursor if it had one)
  - `opencode-agent.md` (from OpenCode's AGENTS.md)
  - `claude-agent.md` (from Claude Code's CLAUDE.md)
  - `gemini-agent.md` (from Gemini's GEMINI.md)

**In each tool's root:**
- Use the tool's native name:
  - OpenCode → `AGENTS.md`
  - Claude Code → `CLAUDE.md`
  - Gemini → `GEMINI.md`
  - Cline → `.clinerules`

### 2. Recommended Mappings

#### For OpenCode (rules/opencode.yaml)

```yaml
mapping:
  inbound:
    # Add this to existing inbound rules
    - from: "AGENTS.md"
      to: "rules/opencode-agent.md"
      format: "file"
  outbound:
    # Add this to existing outbound rules
    - from: "rules/opencode-agent.md"
      to: "AGENTS.md"
      format: "file"
```

#### For Future Claude Code Support (rules/claude-code.yaml)

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

### 3. Content Strategy

**AGENTS.md should contain:**
- Project-agnostic coding standards (SOLID, Clean Code)
- Build/test/lint commands
- TypeScript/language conventions
- General architecture patterns (Hexagonal, DDD)
- Tool-specific instructions (e.g., "use Bun instead of Node")

**Tool-specific rules/ should contain:**
- Project-specific context (this is DotAgents sync tool)
- Module-specific patterns
- Workspace conventions
- Domain knowledge

**Avoid duplication:** Don't repeat the same clean code principles in both AGENTS.md and rules/code.md

### 4. Migration Path

**Phase 1: Enable OpenCode sync (immediate)**
```bash
# 1. Update rules/opencode.yaml with agent-file mapping
# 2. Test sync: AGENTS.md ↔ .agents/rules/opencode-agent.md
# 3. Verify content appears correctly in both locations
```

**Phase 2: Cross-agent compatibility (when needed)**
```bash
# When switching to Claude Code:
# 1. Create rules/claude-code.yaml with CLAUDE.md mapping
# 2. Sync: .agents/rules/opencode-agent.md → .agents/rules/claude-agent.md → CLAUDE.md
# 3. Claude Code reads CLAUDE.md in root
```

**Phase 3: Deduplication (optional)**
```bash
# If AGENTS.md and rules/*.md overlap:
# 1. Keep language/tool conventions in AGENTS.md
# 2. Keep project-specific context in rules/
# 3. Reference AGENTS.md from rules/ instead of duplicating
```

---

## Implementation Checklist

- [ ] Update `rules/opencode.yaml` to include agent-file mappings
- [ ] Test inbound sync: `AGENTS.md` → `.agents/rules/opencode-agent.md`
- [ ] Test outbound sync: `.agents/rules/opencode-agent.md` → `AGENTS.md`
- [ ] Verify no content loss during round-trip sync
- [ ] Create rules for other agents (claude-code, gemini) as needed
- [ ] Document the agent-file pattern in project README
- [ ] Consider: Should `.agents/rules/<id>-agent.md` be the canonical source?

---

## Answers to Your Questions

### Q1: "¿AGENTS.md debe estar siempre en la raíz o puedo crear uno en cada fichero de configuración?"

**Answer:** Depende del propósito:

1. **Para que el IDE/TUI lo detecte** → Debe estar en la **raíz** con el nombre esperado por esa herramienta
   - OpenCode espera `AGENTS.md` en raíz
   - Claude Code espera `CLAUDE.md` en raíz
   - Gemini espera `GEMINI.md` en raíz

2. **Para sincronización entre herramientas** → Debe estar mapeado a `.agents/rules/<id>-agent.md`
   - Esto permite que el paquete `diff` lo migre entre herramientas
   - La versión en `.agents/` es el "puente universal"

**Recomendación:** Mantener AMBOS:
- AGENTS.md en raíz (para OpenCode)
- Mapping a .agents/rules/opencode-agent.md (para sincronización)

### Q2: "¿Nuestro paquete diff soporta migrar este archivo ya que Claude usa CLAUDE.md no AGENTS.md?"

**Answer:** **SÍ, totalmente soportado!** 

El paquete `diff` ya tiene el patrón `agent-file` implementado. Solo necesitas:

1. Crear mapping en `rules/claude-code.yaml`:
   ```yaml
   inbound:
     - from: "CLAUDE.md"
       to: "rules/claude-agent.md"
       format: "file"
   ```

2. El flujo de sincronización sería:
   ```
   OpenCode: AGENTS.md 
     ↓ (inbound)
   .agents/rules/opencode-agent.md (puente)
     ↓ (outbound a Claude)
   .agents/rules/claude-agent.md
     ↓ (outbound)
   Claude Code: CLAUDE.md
   ```

3. Cada herramienta mantiene su nombre nativo en raíz, pero comparten contenido a través del puente `.agents/`

---

## References

- `apps/vscode/access/make_rule_prompt.md` - Documents agent-file pattern
- `rules/cursor.yaml` - Example without agent-file (Cursor uses rules/ folder)
- `rules/opencode.yaml` - Current OpenCode config (needs agent-file mapping)
- Line 239 in make_rule_prompt.md - Claude Code CLAUDE.md example
