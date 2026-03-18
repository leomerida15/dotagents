# Roadmap: Pruebas E2E extensión DotAgents VSCode

Plan para añadir/validar una batería de tests end-to-end que ejecuten la extensión en una ventana de Extension Development Host y verifiquen el comportamiento real (descarga de reglas, sync, migración, add agent).

*Leyenda Status: 🟢 completo | 🟡 incompleto | 🔴 error | 🔵 por hacer*

| Index | Name | Descripcion | Status |
| :---: | :--- | :--- | :---: |
| 1 | **Infraestructura E2E** | Configurar `@vscode/test-electron`, script de launch, carpeta de tests e2e y un test mínimo que abra un workspace y active la extensión. | 🟢 completo |
| 2 | **E2E: Proyecto nuevo (Sync inicial)** | Flujo: workspace sin `.agents` → ejecutar Sync → selector de herramienta → fetch reglas → migración → inicialización. Verificar `.agents/rules`, `.agents/.ai`, state. | 🟢 completo |
| 3 | **E2E: Sync bidireccional** | Workspace ya inicializado; cambiar archivo en source (p. ej. `.cursor` o `.opencode`) y verificar en `.agents`; cambiar en `.agents` y verificar en IDE. Cobertura: cursor y opencode (rules, skills, workflows, mcp, agents). Evidencia: 2026-03-17 opencode full verde. | 🟢 completo |
| 4 | **E2E: Add Agent y reglas faltantes** | Añadir agente manualmente; verificar notificación cuando faltan reglas; verificar flujo cuando existen o se descargan. | 🟢 completo |
| 5 | **E2E: Regresión rutas de reglas** | YAML de agente solo en `.agents/.ai/rules/`; sin duplicado en `.agents/rules/`. | 🟢 completo |
| 6 | **E2E: CI y documentación** | Ejecutar E2E en pipeline (opcional); README o doc de cómo ejecutar e2e en modo debug. Doc en [run-e2e.md](run-e2e.md); job `e2e` en GitHub Actions con xvfb; launch.json corregido para debug. | 🟢 completo |

## Sprints

- [Sprint 1: Infraestructura E2E](sprint-1-infraestructura-e2e.md)
- [Sprint 2: E2E Proyecto nuevo (Sync inicial)](sprint-2-e2e-proyecto-nuevo-sync.md)
- [Sprint 3: E2E Sync bidireccional](sprint-3-e2e-sync-bidireccional.md)
- [Sprint 4: E2E Add Agent + reglas faltantes](sprint-4-e2e-add-agent-reglas-faltantes.md)
- [Sprint 5: E2E Regresión rutas de reglas](sprint-5-e2e-regresion-rutas-reglas.md)
- [Sprint 6: E2E CI + documentación](sprint-6-e2e-ci-documentacion.md)

**Ubicación:** Todos los tests E2E se guardan en `apps/vscode/e2e/` (tests y fixtures, p. ej. `apps/vscode/e2e/fixtures/`).

**Objetivo:** Poder analizar el comportamiento de la extensión en otra ventana del IDE en modo debug mediante tests E2E reproducibles.

