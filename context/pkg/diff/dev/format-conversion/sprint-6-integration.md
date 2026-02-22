# Sprint 6: Integración [diff + rules + apps]

## Context

Validar el flujo completo: reglas YAML con conversión → carga → sync motor → archivos con extensión correcta en destino. Incluye tests E2E y posibles ajustes en la app VSCode.

## Dependencies

- **Depende de**: [Sprint 3: Interpreter](./sprint-3-interpreter.md), [Sprint 5: YamlMapper](./sprint-5-yaml-mapper.md)

## Pasos a ejecutar

1. Test E2E: crear regla con `source_ext`/`target_ext`, ejecutar sync inbound/outbound, verificar extensiones en destino.
2. Verificar flujo en VSCode: FetchAndInstallRulesUseCase + StartSyncOrchestration con reglas que incluyan conversión. Ver [context/apps/vscode/dev/format-conversion-verification.md](../../../apps/vscode/dev/format-conversion-verification.md).
3. Actualizar reglas de ejemplo (cursor.yaml, antigravity.yaml) si se quiere demostrar conversión.
4. Documentar en `sync.md` o `what-it-is.md` que la funcionalidad está implementada.

## Checklist de Tareas

- [x] Test E2E: sync con conversión .mdc ↔ .md.
- [x] Probar en extensión VSCode con proyecto real.
- [x] Reglas de ejemplo con conversión (opcional).
- [x] Actualizar docs de contexto.

## Status

🟢 completo
