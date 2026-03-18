# Sprint 5: E2E Regresión rutas de reglas

## Context

Las reglas YAML del motor viven **solo** en `.agents/.ai/rules/{id}.yaml`. `.agents/rules/` es para contenido sincronizado (p. ej. `.md`), no para duplicar el YAML de definición del agente.

## Dependencies

- **Previous:** Sprints 2 y 4.
- **Next:** Sprint 6.

## Status

- [x] Test proyecto nuevo: `.agents/.ai/rules/{agentId}.yaml`; no `{agentId}.yaml` en `.agents/rules/`.
- [x] Add Agent: regla en `.agents/.ai/rules/`.
- [x] Documentación alineada.
