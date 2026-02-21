# Sprint 2: Adapter de sync inbound

## Context
El motor `@dotagents/diff` expone `SyncProjectUseCase` y usa `Configuration`, `SyncManifest`, `SynchronizeAgentUseCase`. La extensión debe conectarse mediante un adapter que traduzca el entorno VSCode al dominio del diff.

## Dependencies
- **Previous:** Sprint 1 (Inicialización) — requiere `NodeConfigRepository` y estructura `.agents`.
- **Next:** Sprint 3 (Sync outbound), Sprint 4 (Sync incremental).

## Pasos a ejecutar
- Crear `DiffSyncAdapter` que implemente el puerto de sync del orquestador.
- Mapear datos de VSCode (workspace path, agent config, source roots) a DTOs de `@dotagents/diff`.
- Implementar `syncAgent` (inbound: IDE → `.agents`) usando `SyncProjectUseCase` / `SynchronizeAgentUseCase`.
- Usar reglas YAML de `.agents/.ai/rules/{agentId}.yaml` para los mappings.

## Status
- [x] `DiffSyncAdapter` creado.
- [x] `syncAgent` (inbound) conectado a `@dotagents/diff`.
- [x] Mappings `rule.mappings.inbound` aplicados correctamente.
- [x] Configuración cargada desde `NodeConfigRepository`.
