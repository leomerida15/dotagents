# Sprint 3: Unificar AddAgentManually con lista dinámica

## Context

`AddAgentManually` tiene una lista hardcodeada de agentes (`kilo`, `cline`, `roo`, `continue`, `cursor`, `custom`) que no coincide con `WORKSPACE_KNOWN_AGENTS` ni con las reglas disponibles. Debe usar la misma fuente que el selector: WORKSPACE_KNOWN_AGENTS + agentes de `.agents/.ai/rules/` (custom), de modo que "Add Agent Manually" muestre agentes con reglas conocidas o permita añadir custom explícitamente.

## Dependencis

- **Previous:** Sprint 2 (runtime custom rules) — el helper que fusiona WORKSPACE_KNOWN_AGENTS + reglas custom debe existir.
- **Next:** Ninguno.

## Pasos a ejecutar

1. Reutilizar el helper de Sprint 2 que combina WORKSPACE_KNOWN_AGENTS + `.agents/.ai/rules/`.
2. Sustituir la lista hardcodeada en `AddAgentManually.execute()` por la lista dinámica.
3. Mantener la opción "Custom..." para agentes no listados (crear regla vía make_rule_prompt).
4. Ordenar o priorizar: primero conocidos, luego custom.
5. Verificar que `onAgentAdded` sigue funcionando con cualquier `agentId` (incl. custom).

## Status

🟢 completo

## Checklist

- [x] AddAgentManually usa lista dinámica (WORKSPACE_KNOWN_AGENTS + reglas custom)
- [x] Opción "Custom..." preservada
- [x] onAgentAdded funciona con agentId custom
- [x] Sin regresiones en flujo Add Agent
