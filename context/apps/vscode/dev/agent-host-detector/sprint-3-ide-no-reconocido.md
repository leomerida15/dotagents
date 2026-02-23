# Sprint 3: IDE no reconocido

## Context

Cuando el IDE actual no está en `WORKSPACE_KNOWN_AGENTS` (p. ej. usuario usa Windsurf o Cline pero esas reglas aún no existen en GitHub), el sistema devuelve fallback `"vscode"`. El usuario debería ser informado de que su IDE no está soportado y cómo puede contribuir una regla. Ya existe `notifyMissingRules` y el flujo "Add Agent Manually"; este sprint asegura que se informe adecuadamente cuando el IDE detectado no coincide con ningún agente conocido.

## Dependencis

- **Previous:** Sprint 2 (AgentHostDetector dinámico) — el fallback `"vscode"` indica IDE no reconocido.
- **Next:** None

## Pasos a ejecutar

1. Definir cuándo considerar "IDE no reconocido": cuando `appName` no coincide con ningún `agent.id` de `WORKSPACE_KNOWN_AGENTS`.
2. Conectar con `notifyMissingRules` o flujo "Add Agent Manually" para mostrar al usuario el prompt de `make_rule_prompt.md` o enlace a contribuir reglas.
3. Evitar spamear notificaciones: mostrar una vez por sesión o cuando el usuario active sync en un IDE no soportado.
4. Opcional: en la UI del selector, indicar que el IDE actual no tiene reglas y ofrecer "Add Agent Manually".

## Status

🟢 completo

## Checklist

- [x] Definir condición "IDE no reconocido"
- [x] Mostrar notificación o prompt cuando el IDE no está soportado
- [x] Evitar notificaciones repetitivas
- [x] (Opcional) Indicar en selector de herramienta
