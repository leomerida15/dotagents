# Reporte de fallos — Debug extensión DotAgents

**Ámbito:** Extensión VSCode / sync bridge `.agents`  
**Workspace de prueba:** supabase-kit  
**Fecha:** 2025-02-22

---

## 1. Migración mezcla múltiples agentes en `.agents/`

**Síntoma:** En `.agents/rules/` aparecen archivos `.md` (Antigravity) y `.mdc` (Cursor) mezclados.

**Causa:** `MigrateExistingAgentsToBridgeUseCase` detecta todas las carpetas de IDE presentes (`.cursor`, `.agent`, etc.) y copia **todas** al bridge antes de que el usuario elija la herramienta activa. Usa el mismo target `.agents` para cada agente, por lo que el contenido se mezcla.

**Flujo actual:**
1. No existe `.agents` → se ejecuta migración
2. Migración copia `.cursor` → `.agents` y `.agent` → `.agents` (ambos a la misma ruta)
3. Después se muestra el selector de herramienta

**Archivos:** `MigrateExistingAgentsToBridgeUseCase.ts`, `StartSyncOrchestration.ts`

---

## 2. El IDE debe forzar la elección de herramienta primero

**Requisito:** El selector de herramienta debe mostrarse **antes** de cualquier migración o sync. Solo el agente elegido debe poblar el bridge.

**Flujo deseado:**
1. Workspace abierto
2. **Forzar selector** → usuario elige herramienta (Cursor, Antigravity, etc.)
3. Migración (si no existe `.agents`) → copiar **solo** el agente elegido
4. Fetch de reglas, sync inicial, watchers

**Cambios necesarios:**
- `StartSyncOrchestration`: llamar a `selectActiveAgent` antes de la migración cuando no existe `.agents`
- `MigrateExistingAgentsToBridgeUseCase`: aceptar parámetro `activeAgentId` y migrar solo ese agente

---

## 3. Errores de tipos / build (resueltos o aplicados)

| Fallo | Ubicación | Estado |
|-------|-----------|--------|
| `setLastActiveAgent` no existe en SyncManifest | extension.ts | Declaraciones de `@dotagents/diff` desactualizadas; recompilar `packages/diff` |
| `z.array().optional()` en zod/mini | SyncProjectRequestDTO.ts | Corregido: usar `z.optional(z.array(z.string()))` |
| `FsAgentScanner` incompatible con `IAgentScanner` | extension.ts | Corregido: importar `InitializeProjectUseCase` desde `@dotagents/diff` en vez de `@diff/*` |

---

## 4. Estructura observada en supabase-kit/.agents

```
.agents/
  .ai/
    rules/       (cursor.yaml, antigravity.yaml, make_rule_prompt.md)
    state.json
  rules/         (base.md, postgresql.md, base.mdc)  ← mezcla de ambos agentes
  skills/
```

- `base.mdc` → origen Cursor (`.cursor/rules/`)
- `base.md`, `postgresql.md` → origen Antigravity (`.agent/rules/`)
