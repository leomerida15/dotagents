# Sprint 5: E2E Regresión rutas de reglas

## Context

Las reglas YAML del motor (fetch, sync, migración) viven **solo** en `.agents/.ai/rules/{id}.yaml`. `.agents/rules/` contiene reglas de **contenido** sincronizado con el IDE (p. ej. `.md`), no copias duplicadas del YAML de agente. Los E2E actúan como regresión si alguien vuelve a escribir YAML en `.agents/rules/`.

## Dependencies

- **Previous:** Sprint 1. Sprints 2 y 4 proporcionan flujos donde se descargan y usan reglas.
- **Next:** Ninguno; es un sprint de afirmaciones explícitas sobre rutas.

## Pasos a ejecutar

- Tests en `apps/vscode/e2e/`. Reutilizar flujos de Sprints 2 y 4.
- Tras flujo de proyecto nuevo (Sprint 2): afirmar que existe `workspaceRoot/.agents/.ai/rules/{agentId}.yaml` y que **no** existe `.agents/rules/{agentId}.yaml`.
- Tras Add Agent (Sprint 4): regla local en `.agents/.ai/rules/`; sin copia en `.agents/rules/*.yaml` para ese agente.
- Documentar que la ruta canónica del YAML de agente es `.agents/.ai/rules/`.

## Status

- [x] Test proyecto nuevo: regla en `.agents/.ai/rules/{agentId}.yaml`, no en `.agents/rules/`.
- [x] Test Add Agent: regla en `.agents/.ai/rules/`.
- [x] Regresión: no duplicar YAML instalado bajo `.agents/rules/`.
- [x] Documentación de la ruta canónica en e2e o README.
