# Roadmap: Pruebas E2E extensión DotAgents VSCode

Plan para añadir una batería de tests end-to-end que ejecuten la extensión en una ventana de Extension Development Host y verifiquen el comportamiento real (descarga de reglas, sync, migración, add agent).

*Leyenda Status: 🟢 completo | 🟡 incompleto | 🔴 error | 🔵 por hacer*

| Index | Name | Descripcion | Status |
| :---: | :--- | :--- | :---: |
| 1 | **Infraestructura E2E** | Configurar `@vscode/test-electron`, script de launch, carpeta de tests e2e y un test mínimo que abra un workspace y active la extensión. | 🟢 completo |
| 2 | **E2E: Proyecto nuevo (Sync inicial)** | Flujo: workspace sin `.agents` → ejecutar Sync → selector de herramienta → fetch reglas → migración → inicialización. Verificar `.agents/rules`, `.agents/.ai`, state. | 🟢 completo |
| 3 | **E2E: Sync bidireccional** | Workspace ya inicializado; cambiar archivo en source (p. ej. `.cursor`) y verificar en `.agents`; cambiar en `.agents` y verificar en IDE. | 🟢 completo |
| 4 | **E2E: Add Agent y reglas faltantes** | Añadir agente manualmente; verificar notificación cuando faltan reglas; verificar flujo cuando existen o se descargan. | 🟢 completo |
| 5 | **E2E: Regresión rutas de reglas** | Tests que verifiquen que las reglas descargadas se leen y escriben en `.agents/rules/` (no `.agents/.ai/rules/`) en todos los flujos. | 🟢 completo |
| 6 | **E2E: CI y documentación** | Ejecutar E2E en pipeline (opcional); README o doc de cómo ejecutar e2e en modo debug. | 🔵 por hacer |

**Ubicación:** Todos los tests E2E se guardan en `apps/vscode/e2e/` (tests y fixtures, p. ej. `apps/vscode/e2e/fixtures/`).

**Workspace alternativo:** Para probar contra un proyecto real (p. ej. Cursor con `../supabase-kit`), usar la configuración de launch **"Extension E2E Tests (supabase-kit / Cursor)"** en Run and Debug; abre esa carpeta en lugar del fixture.

**Objetivo:** Poder analizar el comportamiento de la extensión en otra ventana del IDE en modo debug mediante tests E2E reproducibles.
