# Sprint 1: Watcher IDE

## Context
El Requisito 4 exige escuchar cambios en archivos del IDE (carpetas como `.cursor`, `.cline`, `.windsurf`, etc.) para poder reaccionar y actualizar `.agents` de forma reactiva.

## Dependencis
- Previous: None
- Next: Sprint 2 (Watcher .agents), Sprint 3 (Integracion)

## Pasos a ejecutar
- Usar `vscode.workspace.createFileSystemWatcher` (o `onDidChangeWatchedFiles`) para observar los source roots del IDE activo.
- Obtener source roots desde `config.agents` (p. ej. `sourceRoot: ".cursor"`) segun la herramienta activa.
- Registrar los watchers al abrir el workspace y al cambiar de herramienta.
- Desechar watchers previos al cambiar de herramienta o workspace.

## Status
- [x] Watcher configurado para source roots del IDE activo.
- [x] Watcher se activa al abrir workspace.
- [x] Watcher se actualiza al cambiar herramienta.
