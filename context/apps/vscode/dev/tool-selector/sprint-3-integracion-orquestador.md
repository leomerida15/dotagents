# Sprint 3: Integracion Orquestador

## Context
El selector debe integrarse al flujo de inicio y al menu manual de la extension.

## Dependencis
- Previous: Sprint 2 (UI + Persistencia)
- Next: Done

## Pasos a ejecutar
- Integrar selector en el flujo de `StartSyncOrchestration` cuando IDE != `manifest.currentAgent`.
- Agregar opcion en el menu para cambiar herramienta manualmente.
- Verificar que el sync use la herramienta seleccionada.

## Status
- [x] Selector integrado en el flujo inicial.
- [x] Opcion de menu para cambiar herramienta agregada.
- [x] Sincronizacion respeta herramienta activa.
