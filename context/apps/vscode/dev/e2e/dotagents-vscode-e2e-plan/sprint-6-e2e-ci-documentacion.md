# Sprint 6: E2E CI y documentación

## Context
Para que la batería E2E sea útil en equipo y en integración continua, debe poder ejecutarse de forma reproducible (local y en CI) y estar documentada. Este sprint cierra el roadmap con CI opcional y documentación clara de cómo ejecutar e2e en modo debug.

## Dependencies
- **Previous:** Sprint 1 obligatorio. Sprints 2–5 aportan tests que deben poder correr en CI.
- **Next:** Ninguno; cierre del roadmap E2E.

## Pasos a ejecutar
- Documentar en `context/apps/vscode/dev/e2e/` o en `apps/vscode/README.md`: cómo ejecutar los tests E2E (ubicados en `apps/vscode/e2e/`) en local, cómo abrir la segunda ventana (Extension Development Host) en modo debug y qué comando o script lanza los e2e.
- Asegurar que el script `test:e2e` (o equivalente) está descrito y que las dependencias (build previo, variables de entorno si aplican) están indicadas.
- Opcional: añadir job o paso en CI (GitHub Actions u otro) que ejecute la batería E2E; tener en cuenta que E2E con UI puede requerir entorno headless o configuración específica (`xvfb`, etc.).
- Actualizar `context/apps/vscode/dev/e2e/status.md` con el estado real de cada sprint según se vayan completando.

## Status
- [x] Documentación de ejecución E2E local y en modo debug.
- [x] Script `test:e2e` referenciado y dependencias (build, etc.) documentadas.
- [x] Opcional: job CI para E2E configurado y estable.
- [x] status.md del roadmap actualizado cuando corresponda.

