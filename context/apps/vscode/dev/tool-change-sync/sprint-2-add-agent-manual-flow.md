# Sprint 2: Add Agent Manual flow

## Context

Actualmente `AddAgentManually` permite elegir un agente pero solo llama a `startSync.execute()` sin pasar el `agentId` seleccionado. El agente no se añade a `config.agents` ni se persiste como `currentAgent`. El flujo debe:

1. Añadir el agente elegido a `config.agents` si no está presente.
2. Persistir `currentAgent` con el nuevo agente.
3. Si existen reglas locales (`.agents/.ai/rules/{agentId}.yaml`), ejecutar sync new.
4. Si no existen reglas, guiar al usuario (make_rule_prompt, Add Agent) y no ejecutar sync.

## Dependencis

- **Previous:** Sprint 1 (Sync new bidireccional).
- **Next:** Sprint 3 integra el flujo completo en el cambio de herramienta.

## Pasos a ejecutar

1. Modificar `AddAgentManually` o su callback `onAgentAdded` para recibir y usar el `agentId` seleccionado.
2. Añadir lógica para registrar el agente en `config.agents` (crear `Agent` con `source_root` si no está en `WORKSPACE_KNOWN_AGENTS`; consultar regla local para mappings).
3. Persistir `currentAgent` y guardar config.
4. Verificar existencia de `.agents/.ai/rules/{agentId}.yaml`.
5. Si existe regla → ejecutar sync new (outbound + inbound).
6. Si no existe → mostrar guía (make_rule_prompt) y opcionalmente ofrecer "Sync Now" cuando el usuario cree la regla.

## Status

🟢 completo

## Checklist

- [x] Pasar `agentId` desde AddAgentManually al flujo de sync
- [x] Añadir agente a config.agents si no existe
- [x] Persistir currentAgent tras Add Agent
- [x] Verificar regla local antes de sync new
- [x] Ejecutar sync new cuando hay reglas
- [x] Guiar al usuario cuando faltan reglas
