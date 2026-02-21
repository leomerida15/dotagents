# Sprint 1: Inicialización del proyecto

## Context
El Requisito 1 exige que al abrir el IDE se detecte si existen `.agents` y `.agents/.ai`; si no existen, crearlos. La extensión debe usar el motor real `@dotagents/diff` para la inicialización.

## Dependencies
- **Previous:** None
- **Next:** Sprint 2 (Adapter inbound) depende de que exista la estructura `.agents` y el repositorio de config.

## Pasos a ejecutar
- Integrar `InitializeProjectUseCase` de `@dotagents/diff` (o equivalente).
- Crear adapter `NodeConfigRepository` que persista en `.agents/.ai/state.json`.
- Llamar a la inicialización al abrir el workspace; usar `onDidChangeWorkspaceFolders` si no hay carpeta al activar.
- Crear `.agents`, `.agents/.ai`, `.agents/.ai/rules` si no existen.

## Status
- [x] `InitializeProjectUseCase` integrado.
- [x] `NodeConfigRepository.save()` y `ensureAIStructure()` crean la estructura.
- [x] Inicialización se ejecuta al abrir workspace.
- [x] `.agents/.ai/state.json` disponible para el resto del flujo.
