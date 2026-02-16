# Sprint 3: Simulation Engine [Sync]

## Context

Este sprint es el núcleo: implementar la lógica de "Simulación" en el módulo de sincronización.
El motor debe recibir las reglas de `.ai/rules/*.yaml` y el estado de `.agents/.ai/state.json`.
Debe calcular las acciones necesarias (`COPY`, `DELETE`, `UPDATE`) antes de ejecutarlas, basándose en la diferencia de tiempo entre el estado guardado y los archivos físicos.

### Objetivos

*   Refactorizar el `SynchronizeAgentUseCase` para usar `SyncManifest` desde `.agents/.ai/state.json`.
*   Actualizar `DefaultSyncInterpreter` para recibir las reglas y generar `SyncAction` solo si el timestamp del archivo origen es > al último timestamp de sincronización.
*   Implementar el "Simulador" que valida y pre-calcula los cambios.

## Dependencies

*   **Bloqueado por**: [Sprint 2: Rule Repository](./sprint-2-rule-repository.md)
*   **Bloquea a**: [Sprint 4: Integration Test](./sprint-4-integration-test.md)

## Checklist de Tareas

- [x] Modificar `ISyncInterpreter` para recibir `manifest` y timestamps.
- [x] Implementar la validación de fecha en `DefaultSyncInterpreter`: solo ejecutar si el archivo origen ha cambiado.
- [x] Implementar la escritura de nuevos timestamps en `manifest` tras ejecutar las acciones.
- [x] `SynchronizeAgentUseCase` debe usar `SyncInterpreter` para obtener acciones y luego ejecutarlas.

## Status

🟢 Completo

## Comentarios

- Actualmente `DefaultSyncInterpreter` copia todo sin validar cambios.
- El timestamp de `.agents/.ai/state.json` es crucial: si un archivo no ha cambiado, no debe sincronizarse.
