# Sprint 3: E2E Sync bidireccional

## Context
Tras tener proyecto inicializado, la extensión debe sincronizar cambios: IDE → `.agents` (inbound) y `.agents` → IDE (outbound), de forma reactiva o mediante Sync manual. Los tests E2E deben comprobar que al modificar archivos en un lado, el otro se actualiza según las reglas.

## Dependencies
- **Previous:** Sprint 1 (Infraestructura). Idealmente Sprint 2 (Proyecto nuevo) para reutilizar fixture inicializado.
- **Next:** Ninguno obligatorio; refuerza confianza en el comportamiento real del sync.

## Pasos a ejecutar
- Partir de un workspace ya inicializado (fixture en `apps/vscode/e2e/fixtures/` con `.agents`, reglas y state ya creados, o usar el flujo del Sprint 2 en setup). Tests en `apps/vscode/e2e/`.
- Test inbound: crear o modificar un archivo en el source root del IDE (p. ej. `.cursor/rules/foo.md` según reglas); verificar que aparece el archivo esperado en `.agents` (según mapping de la regla).
- Test outbound: crear o modificar un archivo bajo `.agents` (ruta mapeada por outbound); verificar que aparece en el source del IDE.
- Opcional: test del comando “DotAgents: Synchronize Now” para forzar sync y luego comprobar contenido.
- Considerar debounce: esperar un tiempo tras escribir antes de afirmar.

## Cobertura E2E

### Cursor
- **Inbound:** `.cursor/rules/` → `.agents/rules/`; skills y rutas según regla cursor.
- **Outbound:** `.agents/rules/` (y mapeos outbound) → `.cursor/`.
- Suite: `DOTAGENTS_E2E_AGENT=cursor DOTAGENTS_E2E_SUITE=full DOTAGENTS_E2E_FIXTURE=newProjectWithCursor bun run test:e2e` (desde `apps/vscode`).

### OpenCode
- **Inbound:** `.opencode/rules/`, `.opencode/skills/`, `.opencode/commands/` → `.agents/rules/`, `.agents/skills/`, `.agents/workflows/`; `opencode.json` → `.agents/mcp/mcp.json` (json-transform) y `.agents/agents/*.json` (json-split).
- **Outbound:** `.agents/rules/`, `.agents/skills/`, `.agents/workflows/` → `.opencode/rules/`, `.opencode/skills/`, `.opencode/commands/`; `.agents/agents/` → `opencode.json` (json-merge); `.agents/mcp/mcp.json` → `opencode.json` (json-transform).
- Suite: `DOTAGENTS_E2E_AGENT=opencode DOTAGENTS_E2E_SUITE=full DOTAGENTS_E2E_FIXTURE=newProjectWithOpencode bun run test:e2e` (desde `apps/vscode`).

### Comando manual
- En ambos flujos se ejecuta `dotagents-vscode.sync` al inicio (inicialización + reglas) y al final (smoke manual).

## Evidencia última ejecución

- **Fecha:** 2026-03-17
- **OpenCode full:** `DOTAGENTS_E2E_AGENT=opencode DOTAGENTS_E2E_SUITE=full DOTAGENTS_E2E_FIXTURE=newProjectWithOpencode bun run test:e2e` → **exit code 0** (inbound rules/skills/workflows + mcp/agents; outbound; manual sync).
- **Cursor full:** `DOTAGENTS_E2E_AGENT=cursor DOTAGENTS_E2E_SUITE=full DOTAGENTS_E2E_FIXTURE=newProjectWithCursor bun run test:e2e` (mismo patrón; ejecutar desde `apps/vscode`).

## Status
- [x] Fixture o setup con proyecto ya inicializado y reglas válidas.
- [x] Test inbound: cambio en IDE → verificación en `.agents`.
- [x] Test outbound: cambio en `.agents` → verificación en IDE.
- [x] Opcional: test del comando Sync manual (automatizado en E2E con `DOTAGENTS_E2E_SYNC_DIRECTION` para evitar QuickPick manual).
- [x] Debounce/retries manejados para no flakiness.
- [x] Sprint 3 terminado: sync bidireccional cubierto para cursor y opencode (rules, skills, workflows, mcp, agents).
