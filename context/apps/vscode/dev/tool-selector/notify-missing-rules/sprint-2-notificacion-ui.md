# Sprint 2: Notificacion UI

## Context
El usuario debe recibir un mensaje claro cuando haya herramientas sin reglas, con referencia a la guia `make_rule.md` para crearlas.

## Dependencis
- Previous: Sprint 1 (Deteccion)
- Next: Sprint 3 (Integracion)

## Pasos a ejecutar
- Mostrar `vscode.window.showWarningMessage` con la lista de agentes sin reglas.
- Incluir accion para abrir o mostrar `make_rule.md` (.agents/.ai/rules/make_rule.md).
- Evitar spam: no notificar en cada sync si ya se notificó recientemente (opcional).

## Status
- [x] Mensaje de advertencia implementado.
- [x] Accion para abrir make_rule.md implementada.
