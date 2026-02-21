# Sprint 2: UI + Persistencia

## Context
El usuario debe poder elegir la herramienta activa desde un QuickPick y guardar la seleccion en el estado del proyecto.

## Dependencis
- Previous: Sprint 1 (Discovery + Defaults)
- Next: Sprint 3 (Integracion Orquestador)

## Pasos a ejecutar
- Implementar un QuickPick con lista de herramientas disponibles.
- Resaltar el default segun la regla de prioridad.
- Persistir la seleccion en `manifest.currentAgent` y `lastActiveAgent`.

## Status
- [x] QuickPick implementado con lista de herramientas.
- [x] Default seleccionado correctamente.
- [x] Estado persistido tras seleccion.
