# Sprint 2: Runtime — custom rules en el selector

## Context

El selector de herramienta activa (Configure Active Agents, flujo inicial) usa `config.agents` o `FsAgentScanner.detectAgents()`, basados en `WORKSPACE_KNOWN_AGENTS`. Si el usuario tiene reglas custom en `.agents/.ai/rules/` (p. ej. `cline.yaml` creado con make_rule_prompt), esos agentes no aparecen. El selector debe fusionar agentes de WORKSPACE_KNOWN_AGENTS con agentes leídos de `.agents/.ai/rules/*.yaml`, parseando `agent.id`, `agent.name` y `paths` (o `source_root`) cuando existan.

## Dependencis

- **Previous:** Sprint 1 (build) — opcional para arrancar; sin él se usa la lista actual. El helper de fusión debe poder trabajar con la lista generada cuando exista.
- **Next:** Sprint 3 (AddAgentManually) reutiliza el mismo helper de lista fusionada.

## Pasos a ejecutar

1. Crear un caso de uso o helper que lea `.agents/.ai/rules/*.yaml` y extraiga `agent.id`, `agent.name`, y `paths` (o `source_root`); devolver lista de agentes “custom” con la misma forma mínima que necesita el selector (id, name, sourceRoot o paths).
2. En el flujo del selector (`selectActiveAgentBase`, `selectAgentForNewProject`), combinar:
   - Agentes de `config.agents` / `FsAgentScanner`.
   - Agentes de reglas en `.agents/.ai/rules/` que no estén ya en la lista.
3. Evitar duplicados por `agent.id`.
4. Mantener prioridad de detección existente (p. ej. hostAgentId como default).

## Status

🟢 completo

## Checklist

- [x] Helper que lista agentes desde .agents/.ai/rules/*.yaml (id, name, paths/source_root)
- [x] Fusionar con lista existente en selector (sin duplicados)
- [x] selectActiveAgentBase usa lista fusionada
- [x] selectAgentForNewProject usa lista fusionada
- [x] Tests o verificación manual
