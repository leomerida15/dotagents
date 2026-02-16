# Sprint 1: Schema & Persistence [Config]

## Context

Este sprint se centra en definir la estructura de `.agents/` para separar la "configuración pública" de la "configuración interna" (`.ai/`).
El objetivo es migrar la persistencia del estado de sincronización (`SyncManifest`) para que se guarde en `.agents/.ai/state.json` en lugar de en la raíz, utilizando timestamps como identificadores únicos de cada evento.

### Objetivos

*   Crear la carpeta `.agents/.ai/` y la subcarpeta `.agents/.ai/rules/` y `.agents/.ai/state/`.
*   Actualizar `SyncManifest` para manejar los nuevos `timestamp-id`.
*   Actualizar `BunConfigRepository` para escribir y leer `state.json` desde la nueva ubicación.

## Dependencies

*   **Bloquea a**: [Sprint 2: Rule Repository](./sprint-2-rule-repository.md)

## Checklist de Tareas

- [x] Definir la estructura de `.agents/.ai/` en el `ConfigRepository` (`mkdir .agents/.ai` durante el setup).
- [x] Mover la lectura/escritura de `sync.json` a `.agents/.ai/state.json`.
- [x] Actualizar `SyncManifest` para incluir el ID de evento basado en timestamp.
- [x] Incluir Tests unitarios para verifying la creación de `.agents/.ai/` y la persistencia de estado.
- [x] Documentar el schema de `.ai/rules/*.yaml` y `.ai/state.json` en `context/pkg/diff/doc.md`.

## Status

🟢 Completo

## Comentarios

- Actualmente `SyncManifest` usa un timestamp simple. Debemos asegurarnos de que el ID del evento sea consistente y único.
- El repositorio de configuración (`BunConfigRepository`) debe asegurar que `.agents/.ai` exista y no sea borrado por accidente.
