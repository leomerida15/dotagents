# Sprint 5: E2E Regresión rutas de reglas

## Context
La extensión debe guardar y leer las reglas de migración/sync en un único lugar: `.agents/rules/`. Cualquier flujo que descargue o use reglas debe usar esa ruta (no `.agents/.ai/rules/` para los YAML de agente). Los E2E deben actuar como tests de regresión para que un cambio de ruta rompa los tests.

## Dependencies
- **Previous:** Sprint 1. Sprints 2 y 4 proporcionan flujos donde se descargan y usan reglas.
- **Next:** Ninguno; es un sprint de afirmaciones explícitas sobre rutas.

## Pasos a ejecutar
- Tests en `apps/vscode/e2e/`. Reutilizar flujos de Sprints 2 y 4.
- Tras flujo de proyecto nuevo (Sprint 2): afirmar que el archivo de regla existe en `workspaceRoot/.agents/rules/{agentId}.yaml` y no solo en `.agents/.ai/rules/`.
- Tras Add Agent (Sprint 4): afirmar que la regla usada/descargada está en `.agents/rules/{agentId}.yaml`.
- Test explícito: después de FetchAndInstallRules (vía Sync o Add Agent), listar archivos en `.agents/rules/` y comprobar que hay al menos un `*.yaml` para el agente esperado; opcionalmente comprobar que `.agents/.ai/rules/*.yaml` no es el que usa el sync (o que no se crean ahí los descargados).
- Documentar en el test o en dev/e2e que la ruta canónica de reglas es `.agents/rules/`.

## Status
- [x] Afirmación en test proyecto nuevo: regla en `.agents/rules/{agentId}.yaml`.
- [x] Afirmación en test Add Agent: regla en `.agents/rules/`.
- [x] Test o afirmación explícita de que las reglas descargadas no se escriben en `.agents/.ai/rules/` (solo en `.agents/rules/`).
- [x] Documentación de la ruta canónica en e2e o README.
