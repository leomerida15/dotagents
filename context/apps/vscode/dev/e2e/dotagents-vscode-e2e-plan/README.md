# Pruebas E2E – Extensión DotAgents VSCode

Los tests E2E ejecutan la extensión en una ventana de **Extension Development Host** y verifican el comportamiento real (comandos, reglas, sync).

## Ubicación

- **Tests y runner:** `apps/vscode/e2e/`
- **Suite:** `apps/vscode/e2e/suite/`
- **Fixtures (workspaces de prueba):** `apps/vscode/e2e/fixtures/`

## Cómo ejecutar los E2E

**Guía detallada:** [run-e2e.md](run-e2e.md) (variables de entorno, escenarios minimal/full, modo debug).

Desde `apps/vscode`:

```bash
cd apps/vscode
bun run test:e2e
```

En modo E2E, el runner fija variables de entorno para evitar interacción humana en la UI:

- `DOTAGENTS_E2E=1`
- `DOTAGENTS_E2E_AGENT=cursor` (puedes cambiarlo a `opencode`)
- `DOTAGENTS_E2E_SYNC_DIRECTION=inbound` (puedes cambiarlo a `outbound`)
- `DOTAGENTS_E2E_SUITE=minimal` (smoke-check sin UI interactiva)

## Verificación mínima (Sprint 1)

Para validar solo la infraestructura (sin ejecutar la batería completa), el runner usa por defecto un **suite minimal** y una configuración aislada de VS Code:

- **Fixture**: `apps/vscode/e2e/fixtures/newProjectWithCursor`
- **User data**: `apps/vscode/.vscode-test/user-data-e2e`
- **Extensions dir**: `apps/vscode/.vscode-test/extensions-e2e`

Ejecuta:

```bash
cd apps/vscode
bun run test:e2e
```

Si falla por instancia duplicada, mata procesos antiguos de test host o reintenta (la configuración aislada está pensada para coexistir con un VS Code normal abierto).

## Ruta canónica de reglas

- YAML del motor (instaladas/descargadas): **`.agents/.ai/rules/{agentId}.yaml`**.
- **`.agents/rules/`**: contenido del puente (p. ej. `.md`), no copias del YAML de agente.

## Plan y sprints

Ver [status.md](status.md) y los archivos `sprint-*.md` en este directorio.

