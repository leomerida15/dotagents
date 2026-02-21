# Sprint 2: Watcher .agents

## Context
El Requisito 4 exige escuchar cambios en `.agents` para detectar cuando el usuario o otra herramienta modifica el puente y poder aplicar reglas hacia el IDE seleccionado.

## Dependencis
- Previous: Sprint 1 (Watcher IDE) — compartir patron de infraestructura.
- Next: Sprint 3 (Integracion sync reactivo)

## Pasos a ejecutar
- Usar `vscode.workspace.createFileSystemWatcher` para observar cambios en `.agents/**`.
- Excluir `.agents/.ai/state.json` si aplica para evitar bucles.
- Registrar el watcher al abrir el workspace; desechar al cerrar.

## Status
- [x] Watcher configurado para `.agents`.
- [x] Exclusiones correctas para evitar bucles.
- [x] Watcher se activa y desactiva con el workspace.
