# Sprint 4: E2E Add Agent y reglas faltantes

## Context
El flujo “Add Agent/IDE Manually” y la notificación de reglas faltantes deben comportarse bien en una ventana real: al añadir un agente sin regla se debe ofrecer crear regla (make_rule) o descargar si existe en repo; si faltan reglas tras Sync, debe mostrarse el aviso con opción de abrir make_rule. Los E2E deben cubrir estos casos.

## Dependencies
- **Previous:** Sprint 1 (Infraestructura). Sprint 2 ayuda a tener un workspace ya inicializado.
- **Next:** Sprint 5 puede reutilizar estos flujos para afirmar rutas `.agents/rules/`.

## Pasos a ejecutar
- Tests en `apps/vscode/e2e/`; fixtures en `apps/vscode/e2e/fixtures/` si aplica.
- Test “Add Agent cuando la regla existe o se descarga”: workspace inicializado, ejecutar comando Add Agent, elegir un agente con regla en GitHub; verificar que se descarga (o ya existe), se añade a config y se hace sync; verificar `.agents/rules/{agentId}.yaml`.
- Test “Add Agent cuando la regla no existe”: elegir o simular un agente sin regla en repo; verificar que se muestra notificación/mensaje y opción make_rule (sin bloquear el test de forma irreversible).
- Test “Reglas faltantes tras Sync”: config con un agente cuyo archivo de regla no existe; ejecutar Sync; verificar que se muestra aviso de reglas faltantes (y opcionalmente que se ofrece abrir make_rule).

## Status
- [x] Test Add Agent con regla existente o descargable; verificación de regla en disco.
- [x] Test Add Agent sin regla; verificación de notificación / make_rule.
- [x] Test Sync con agente sin regla; verificación de aviso de reglas faltantes.
