# Sprint 3: Sincronizar solo con reglas locales

## Context
No se debe ejecutar sync ni migración si no existe `.agents/.ai/rules/{agentId}.yaml` para la herramienta activa. La migración debe usar reglas descargadas (desde YAML), no `DEFAULT_MIGRATION_RULES` de `WorkspaceAgents.ts`.

## Dependencis
- **Previous:** Sprint 2 (descarga de reglas): las reglas deben estar disponibles localmente.
- **Next:** Sprint 4 refuerza el bloqueo cuando las reglas no existen.

## Pasos a ejecutar
- Eliminar uso de `DEFAULT_MIGRATION_RULES` en `MigrateExistingAgentsToBridgeUseCase`.
- Leer reglas desde `.agents/.ai/rules/{agentId}.yaml` para la migración (parsear YAML, extraer mappings inbound).
- Verificar que existe el archivo de reglas antes de ejecutar sync o migración; si no existe → no ejecutar.
- `DiffSyncAdapter` / sync ya usa reglas de YAML; asegurar que migración use la misma fuente.

## Status
- [x] `MigrateExistingAgentsToBridgeUseCase` usa reglas desde YAML, no `DEFAULT_MIGRATION_RULES`.
- [x] Guard: no sync ni migración si no existe `.agents/.ai/rules/{agentId}.yaml`.
- [x] Tests de migración actualizados.
