# Sprint 1: Known Agents solo los que tienen reglas en GitHub

## Context

`WORKSPACE_KNOWN_AGENTS` en `WorkspaceAgents.ts` define qué agentes se reconocen para detección y sync. Actualmente tiene 7 entradas (antigravity, cursor, claude-code, cline, windsurf, openclaw, opencode), pero en el repositorio de reglas de GitHub (`leomerida15/dotagents`, carpeta `rules/`) solo existen `antigravity.yaml` y `cursor.yaml`. Los agentes reconocidos deben ser únicamente aquellos para los que existen reglas, para evitar detectar IDEs sin soporte de sincronización configurado.

## Dependencis

- **Previous:** None
- **Next:** Sprint 2 (AgentHostDetector dinámico) — el detector iterará sobre esta lista reducida.

## Pasos a ejecutar

1. En `apps/vscode/src/modules/orchestrator/domain/WorkspaceAgents.ts`, reducir `WORKSPACE_KNOWN_AGENTS` a solo `antigravity` y `cursor`.
2. Eliminar: `claude-code`, `cline`, `windsurf`, `openclaw`, `opencode`.
3. Revisar usos de `WORKSPACE_KNOWN_AGENTS` en `FsAgentScanner`, `AgentHostDetector` y otros módulos para asegurar que no se rompa nada.
4. Ejecutar tests y verificar que la detección y sync siguen funcionando para los agentes restantes.

## Status

🟢 completo

## Checklist

- [x] Reducir `WORKSPACE_KNOWN_AGENTS` a antigravity y cursor
- [x] Eliminar entradas sin reglas en GitHub
- [x] Revisar y ajustar referencias en FsAgentScanner y otros módulos
- [x] Tests pasando
