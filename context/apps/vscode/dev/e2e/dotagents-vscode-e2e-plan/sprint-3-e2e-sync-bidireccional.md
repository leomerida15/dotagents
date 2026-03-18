# Sprint 3: E2E Sync bidireccional

## Context
Tras tener proyecto inicializado, la extensión debe sincronizar cambios: IDE → `.agents` (inbound) y `.agents` → IDE (outbound), de forma reactiva o mediante Sync manual. Los tests E2E deben comprobar que al modificar archivos en un lado, el otro se actualiza según las reglas.

## Dependencies
- **Previous:** Sprint 1 (Infraestructura). Idealmente Sprint 2 (Proyecto nuevo) para reutilizar fixture inicializado.
- **Next:** Ninguno obligatorio; refuerza confianza en el comportamiento real del sync.

## Pasos a ejecutar
- Partir de un workspace ya inicializado (fixture en `apps/vscode/e2e/fixtures/` con `.agents`, reglas y state ya creados, o usar el flujo del Sprint 2 en setup). Tests en `apps/vscode/e2e/`.
- Test inbound: crear o modificar un archivo en el source root del IDE (p. ej. `.cursor/rules/foo.md` según reglas); verificar que aparece el archivo esperado en `.agents` (según mapping de la regla).
- Test outbound: crear o modificar un archivo bajo `.agents` (ruta mapeada por outbound); verificar que aparece en el source del IDE.
- Opcional: test del comando “DotAgents: Synchronize Now” para forzar sync y luego comprobar contenido.
- Considerar debounce: esperar un tiempo tras escribir antes de afirmar.

## Status
- [x] Fixture o setup con proyecto ya inicializado y reglas válidas.
- [x] Test inbound: cambio en IDE → verificación en `.agents`.
- [x] Test outbound: cambio en `.agents` → verificación en IDE.
- [x] Opcional: test del comando Sync manual (automatizado en E2E con `DOTAGENTS_E2E_SYNC_DIRECTION` para evitar QuickPick manual).
- [x] Debounce/retries manejados para no flakiness.

