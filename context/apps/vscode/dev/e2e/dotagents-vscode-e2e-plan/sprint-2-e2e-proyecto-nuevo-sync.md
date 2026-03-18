# Sprint 2: E2E Proyecto nuevo (Sync inicial)

## Context
El flujo más crítico es el de proyecto nuevo: usuario abre un workspace sin `.agents`, ejecuta Sync, elige herramienta, la extensión descarga reglas, migra carpetas del IDE a `.agents` e inicializa el proyecto. Los tests E2E deben reproducir este flujo en el Extension Development Host y verificar el resultado en disco y estado.

## Dependencies
- **Previous:** Sprint 1 (Infraestructura E2E). Necesita launch, runTests y test mínimo.
- **Next:** Sprint 5 (Regresión rutas) puede reutilizar este flujo para afirmar que las reglas quedan en `.agents/rules/`.

## Pasos a ejecutar
- Usar un fixture de workspace “limpio” en `apps/vscode/e2e/fixtures/`: sin `.agents`, opcionalmente con `.cursor` o `.cline` para migración. Los tests en `apps/vscode/e2e/`.
- En el test: abrir ese workspace, ejecutar el comando `dotagents-vscode.sync`.
- Simular o aceptar el selector de herramienta (elegir un agente conocido, p. ej. cursor) para no bloquear el test.
- Esperar a que el flujo termine (inicialización, fetch de reglas, migración).
- Verificar en disco: existe `.agents/rules/{agentId}.yaml`, existe `.agents/.ai/state.json` (o equivalente), estructura `.agents` esperada.
- Verificar que el manifest tiene `currentAgent` y el agente en `agents`.

## Nota: probar contra un proyecto real (Cursor / supabase-kit)

Para que el Extension Development Host abra `../supabase-kit` en lugar del fixture, usa la configuración **"Extension E2E Tests (supabase-kit / Cursor)"** en Run and Debug. El test de proyecto nuevo puede fallar o comportarse distinto si ese proyecto ya tiene `.agents`; esa config está pensada para pruebas manuales contra Cursor.

## Status
- [x] Fixture workspace limpio en `apps/vscode/e2e/fixtures/` (sin .agents) disponible.
- [x] Test ejecuta comando Sync y completa flujo de proyecto nuevo.
- [x] Selector de herramienta manejado (pick o mock para tests).
- [x] Verificación de `.agents/rules/{agentId}.yaml` en el test.
- [x] Verificación de state/manifest y estructura `.agents`.

