# Sprint 1: Infraestructura E2E

## Context
Para analizar el comportamiento de la extensión en otra ventana del IDE en modo debug hace falta una batería de tests E2E. El primer paso es disponer de la infraestructura: `@vscode/test-electron`, un script que lance el Extension Development Host, y una carpeta de tests con al menos un test que abra un workspace y verifique que la extensión está activa.

## Dependencies
- **Previous:** Ninguno.
- **Next:** Sprint 2 (Proyecto nuevo) y el resto de sprints E2E dependen de que exista el launch y un test mínimo pasando.

## Pasos a ejecutar
- Añadir dependencia `@vscode/test-electron` en `apps/vscode/package.json`.
- Crear configuración de launch para E2E (o reutilizar/adaptar la de “Extension” para que el test runner use el mismo host).
- Crear carpeta `apps/vscode/e2e/` con `runTest.ts` / entrypoint que use `runTests` de `@vscode/test-electron`. Todos los tests E2E se guardan en `apps/vscode/e2e/`.
- Crear workspace de prueba (fixture) en `apps/vscode/e2e/fixtures/` (p. ej. proyecto vacío o con `.cursor`).
- Escribir un test E2E mínimo: abrir el workspace de prueba, esperar a que la extensión esté activa (p. ej. ejecutar un comando o comprobar que no lanza).
- Añadir script `test:e2e` en `apps/vscode/package.json` que ejecute la batería E2E.

## Nota: workspace para probar contra Cursor

Existe una segunda configuración de launch **"Extension E2E Tests (supabase-kit / Cursor)"** que abre la carpeta `../supabase-kit` en lugar del fixture. Úsala cuando quieras que el host abra ese proyecto (p. ej. para probar contra Cursor). Los tests automatizados siguen usando el fixture por defecto en `runTest.ts`.

## Status
- [x] Dependencia `@vscode/test-electron` instalada.
- [x] Configuración de launch/run para E2E definida.
- [x] Carpeta `apps/vscode/e2e/` y entrypoint `runTests` creados.
- [x] Workspace fixture en `apps/vscode/e2e/fixtures/` disponible.
- [x] Test mínimo (abrir workspace + extensión activa) pasando.
- [x] Script `test:e2e` en `package.json` y documentado en README o dev/e2e.

### Evidencia (verificación local)
- Fecha: 2026-03-17
- Comando: `cd apps/vscode && bun run test:e2e`
- Resultado: exit code 0 (suite `DOTAGENTS_E2E_SUITE=minimal`)
