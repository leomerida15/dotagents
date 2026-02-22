# Sprint 1: Herramienta definida obligatoriamente

## Context
Actualmente el flujo ejecuta migración antes de pedir la herramienta al usuario. El item 2.4 exige que no se avance (no migrar, no sincronizar) hasta que el usuario haya seleccionado herramienta. Si cancela o no selecciona, la extensión debe esperar sin ejecutar migración ni sync.

## Dependencis
- **Previous:** Depende de que exista `selectActiveAgent` (tool-selector) y estructura mínima para mostrar el selector.
- **Next:** Sprint 2 requiere que la herramienta esté seleccionada antes de descargar reglas.

## Pasos a ejecutar
- Reordenar `StartSyncOrchestration.execute()` para mostrar selector de herramienta antes de migración e inicialización cuando proyecto no existe.
- Cuando `!configRepository.exists(workspaceRoot)`: primero detectar agentes presentes, mostrar selector, y solo si el usuario selecciona → continuar con init/migración.
- Si el usuario cancela el selector → retornar sin migrar ni inicializar; mostrar mensaje de estado apropiado.
- Garantizar que `MigrateExistingAgentsToBridgeUseCase` no se llame hasta después de la selección.

## Status
- [x] Flujo reordenado: selector antes de migración en proyectos nuevos.
- [x] Si usuario cancela → no migrar ni inicializar.
- [x] Mensaje de estado cuando se espera selección.
- [x] Tests actualizados para el nuevo orden.
