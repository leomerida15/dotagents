# Sprint 3: Integración en cambio de herramienta

## Context

Cuando el usuario cambia de herramienta activa mediante el selector (`selectActiveAgent` / Configure Active Agents), debe ejecutarse sync new automáticamente si existen reglas para el agente elegido. Esto aplica tanto al flujo de cambio manual como al detectado (IDE distinto de `currentAgent` al abrir).

Orden requerido: **regla → herramienta** — no sync sin reglas. Si el usuario cambia a un agente sin reglas, se bloquea y se guía.

## Dependencis

- **Previous:** Sprint 1 (Sync new), Sprint 2 (Add Agent flow).
- **Next:** Ninguno (roadmap cerrado).

## Pasos a ejecutar

1. Tras `selectActiveAgent` (cuando el usuario confirma la selección), comprobar si existe regla para el agente elegido.
2. Si existe regla → ejecutar sync new (outbound + inbound) tras guardar `currentAgent`.
3. Si no existe → no ejecutar sync; mantener el guard existente (status bar "Reglas faltantes").
4. Integrar el mismo comportamiento cuando `StartSyncOrchestration` detecta `currentAgent !== hostAgentId` y el usuario elige herramienta vía selector.
5. Actualizar documentación en `comportamiento-actual-vs-planteado.md` si procede.

## Status

🟢 completo

## Checklist

- [x] Disparar sync new tras selectActiveAgent cuando hay reglas
- [x] No ejecutar sync cuando faltan reglas (guard existente)
- [x] Integrar en flujo StartSyncOrchestration (cambio detectado por IDE)
- [x] Verificar que el orden regla → herramienta se respeta
- [x] Actualizar documentación de comportamiento
