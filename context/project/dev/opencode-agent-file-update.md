# OpenCode Agent File Mapping - Implementation Proposal

**Date**: 2026-03-08  
**Status**: Ready to implement  
**Related**: context/project/decisions/AGENTS-MD-STRATEGY.md

---

## Goal

Enable AGENTS.md to sync bidirectionally between OpenCode and the `.agents/` universal bridge, allowing cross-agent portability.

---

## Changes Required

### File: `rules/opencode.yaml`

**Add to capability matrix comment (line 32):**

```yaml
#  agent-file  ✅  AGENTS.md ↔ .agents/rules/opencode-agent.md
```

**Add to paths section:**

```yaml
paths:
  - path: ".opencode/"
    scope: "workspace"
    type: "directory"
    purpose: "marker"
  - path: ".config/opencode"
    scope: "home"
    type: "directory"
    purpose: "config"
  # Add this:
  - path: "AGENTS.md"
    scope: "workspace"
    type: "file"
    purpose: "sync_source"
```

**Add to inbound mapping (after rules/):**

```yaml
inbound:
  # [rules] ✅ Persistent behavior instructions (always-on, auto-applied)
  - from: "rules/"
    to: "rules/"
    format: "directory"

  # [agent-file] ✅ Single root instruction file
  - from: "AGENTS.md"
    to: "rules/opencode-agent.md"
    format: "file"

  # [skills] ... (rest of mappings)
```

**Add to outbound mapping (after rules/):**

```yaml
outbound:
  # [rules] ✅
  - from: "rules/"
    to: "rules/"
    format: "directory"

  # [agent-file] ✅
  - from: "rules/opencode-agent.md"
    to: "AGENTS.md"
    format: "file"

  # [skills] ... (rest of mappings)
```

---

## Complete Updated File

```yaml
version: "1.0"
agent:
  id: "opencode"
  name: "OpenCode"
  ui:
    icon: "terminal"
    color: "#00d4aa"
    description: "AI-powered terminal coding agent with integrated SDD workflows"

paths:
  - path: ".opencode/"
    scope: "workspace"
    type: "directory"
    purpose: "marker"
  - path: ".config/opencode"
    scope: "home"
    type: "directory"
    purpose: "config"
  - path: "AGENTS.md"
    scope: "workspace"
    type: "file"
    purpose: "sync_source"

# ─── Capability Matrix ────────────────────────────────────────────────────────
#  rules       ✅  .opencode/rules/ (.md)              → persistent instructions
#  skills      ✅  .opencode/skills/ (folders+SKILL.md) → on-demand capabilities
#  workflows   ✅  .opencode/commands/ (slash commands) → user-invocable actions
#              ✅  .opencode/workflows/ (task prompts)  → user-invocable actions
#  agents      ✅  .opencode/opencode.json ($.agent)    → custom agent modes (❌ not a rule)
#  mcp         ✅  .opencode/opencode.json ($.mcp) ↔ listado único .agents/mcp/mcp.json
#  agent-file  ✅  AGENTS.md ↔ .agents/rules/opencode-agent.md
#  docs        ❌  No native docs folder

mapping:
  # ── INBOUND: .opencode/ → .agents/ ──────────────────────────────────────────

  inbound:
    # [rules] ✅ Persistent behavior instructions (always-on, auto-applied)
    - from: "rules/"
      to: "rules/"
      format: "directory"

    # [agent-file] ✅ Single root instruction file
    - from: "AGENTS.md"
      to: "rules/opencode-agent.md"
      format: "file"

    # [skills] Specialized on-demand capabilities (folders with SKILL.md)
    - from: "skills/"
      to: "skills/"
      format: "directory"

    # [workflows] Slash commands → bridge workflows (primary: /cmd syntax)
    - from: "commands/"
      to: "workflows/"
      format: "directory"

    # [workflows] Extended task prompts → bridge workflows (secondary merge)
    - from: "workflows/"
      to: "workflows/"
      format: "directory"

    # [mcp] Listado único en el puente
    - from: "opencode.json"
      to: "mcp/mcp.json"
      format: "json-transform"
      extract: "$.mcp"
      adapter: "mcp-standard"

    # [agents] Custom agent/mode definitions
    - from: "opencode.json"
      to: "agents/"
      format: "json-split"
      extract: "$.agent"
      adapter: "agent-json"
      target_ext: ".json"

  # ── OUTBOUND: .agents/ → .opencode/ ─────────────────────────────────────────

  outbound:
    # [rules] ✅
    - from: "rules/"
      to: "rules/"
      format: "directory"

    # [agent-file] ✅
    - from: "rules/opencode-agent.md"
      to: "AGENTS.md"
      format: "file"

    # [skills]
    - from: "skills/"
      to: "skills/"
      format: "directory"

    # [workflows] Bridge workflows → OpenCode slash commands
    - from: "workflows/"
      to: "commands/"
      format: "directory"

    # [agents] Merge agent definitions back into opencode.json
    - from: "agents/"
      to: "opencode.json"
      format: "json-merge"
      adapter: "opencode-config"

    # [mcp] Listado único del puente → opencode.json $.mcp
    - from: "mcp/mcp.json"
      to: "opencode.json"
      format: "json-transform"
      adapter: "mcp-standard"

target_standard: ".agents/"
```

---

## Test Plan

### 1. Inbound Sync Test (OpenCode → Bridge)

```bash
# Setup
cd /var/home/snor/Documents/libs/dotagents
echo "# Test Content" > AGENTS.md

# Run sync (assuming CLI or VSCode extension)
# Expected: AGENTS.md content → .agents/rules/opencode-agent.md

# Verify
cat .agents/rules/opencode-agent.md
# Should contain: "# Test Content"
```

### 2. Outbound Sync Test (Bridge → OpenCode)

```bash
# Setup
echo "# Bridge Content" > .agents/rules/opencode-agent.md

# Run sync
# Expected: .agents/rules/opencode-agent.md → AGENTS.md

# Verify
cat AGENTS.md
# Should contain: "# Bridge Content"
```

### 3. Round-Trip Test

```bash
# Setup
cat > AGENTS.md << 'EOF'
# AGENTS.md - Test
Build commands: bun test
EOF

# Run sync inbound → outbound
# Expected: AGENTS.md → .agents/rules/opencode-agent.md → AGENTS.md
# No data loss

# Verify
diff AGENTS.md <(cat .agents/rules/opencode-agent.md)
# Should be identical
```

### 4. Cross-Agent Test (Future: OpenCode → Claude Code)

```bash
# Setup (requires claude-code.yaml with agent-file mapping)
# 1. Content in AGENTS.md
# 2. Sync inbound to .agents/
# 3. Create CLAUDE.md from .agents/rules/opencode-agent.md

# Expected flow:
# AGENTS.md → .agents/rules/opencode-agent.md
# (User creates claude-code.yaml)
# .agents/rules/opencode-agent.md → CLAUDE.md

# Verify
# CLAUDE.md should have same content as AGENTS.md
```

---

## Implementation Steps

1. **Update rules/opencode.yaml** with the mappings above
2. **Test with current AGENTS.md**:
   - Run sync to ensure AGENTS.md → .agents/rules/opencode-agent.md
   - Verify content integrity
3. **Document in README**:
   - Explain agent-file pattern
   - List supported agents and their file names
4. **Create claude-code.yaml** (when needed):
   - Add CLAUDE.md → rules/claude-agent.md mapping
   - Test cross-agent sync

---

## Breaking Changes

**None.** This is additive:
- Existing AGENTS.md continues to work as-is
- New mappings enable sync, don't require it
- Other agents (Cursor, Antigravity) unaffected

---

## Future Agents to Support

| Agent | Root File | Bridge Mapping |
|-------|-----------|----------------|
| OpenCode ✅ | AGENTS.md | rules/opencode-agent.md |
| Claude Code | CLAUDE.md | rules/claude-agent.md |
| Gemini | GEMINI.md | rules/gemini-agent.md |
| Cline | .clinerules | rules/cline-agent.md |
| Cursor | (none) | N/A - uses rules/ folder |
| Antigravity | (none) | N/A - uses rules/ folder |

---

## Open Questions

1. **Canonical source**: Should `.agents/rules/<id>-agent.md` be the source of truth, or the root file?
   - Recommendation: Root file is source, `.agents/` is sync target
   - Rationale: Root file is what IDE/TUI reads

2. **Conflict resolution**: What if AGENTS.md and .agents/rules/opencode-agent.md differ?
   - Recommendation: Timestamp-based or explicit direction flag
   - Implementation: Check diff package's sync conflict strategy

3. **Content deduplication**: AGENTS.md vs .opencode/rules/*.md overlap
   - Recommendation: 
     - AGENTS.md = tool-agnostic standards (SOLID, Bun, TypeScript)
     - .opencode/rules/ = project-specific (DotAgents architecture, modules)

---

## References

- `context/project/decisions/AGENTS-MD-STRATEGY.md` - Full strategy doc
- `apps/vscode/access/make_rule_prompt.md` - Agent-file pattern spec
- `rules/opencode.yaml` - Current config (to be updated)
