# Sprint 1: Discovery + Defaults

## Context
El selector necesita un valor por defecto basado en el IDE actual y la deteccion de agentes existentes.

## Dependencis
- Previous: None
- Next: Sprint 2 (UI + Persistencia)

## Pasos a ejecutar
- Definir la logica para detectar el IDE host (vscode.env.appName) y mapearlo a un agentId.
- Definir la prioridad de default: IDE host vs `manifest.currentAgent`.
- Documentar el modelo de datos usado por el selector (id, name, sourceRoot).

## Documentacion
- Mapeo IDE host -> agentId (segun `DiffSyncAdapter.detectAgentFromHostApp`):
  - `cline` si `appName` incluye "cline".
  - `cursor` si incluye "cursor".
  - `windsurf` si incluye "windsurf".
  - `opencode` si incluye "opencode".
  - `cursor` si incluye "visual studio code" o "vscode".
  - Fallback: `cursor`.
- Prioridad default: primero IDE host, si no hay match entonces `manifest.currentAgent`.
- Modelo de datos del selector: items de `state.json` con `id`, `name`, `sourceRoot`.

## Status
- [x] Mapeo IDE host -> agentId definido.
- [x] Regla de prioridad para default documentada.
- [x] Modelo de datos del selector documentado.
