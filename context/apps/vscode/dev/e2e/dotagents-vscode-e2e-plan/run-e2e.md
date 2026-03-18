# Ejecutar tests E2E – Extensión DotAgents VSCode

Guía para ejecutar la batería E2E de forma local y en modo debug.

## Comando y dependencias

El comando que ejecuta la batería E2E es **`bun run test:e2e`**, definido en [apps/vscode/package.json](../../../../apps/vscode/package.json). El script hace **build previo** de la extensión (`bun run -b build`) y luego lanza el runner (`bun run -b e2e/runTest.ts`), por lo que no hace falta ejecutar `bun run build` por separado salvo que solo quieras compilar.

**Dependencias:**

- Bun instalado.
- Dependencias del monorepo instaladas: desde la raíz del repo, `bun install`.
- Ejecutar siempre desde `apps/vscode` (o con `working-directory: apps/vscode` en CI).

## Ejecución local

Desde la raíz del monorepo:

```bash
cd apps/vscode
bun run test:e2e
```

Sin variables de entorno adicionales, el runner usa valores por defecto (p. ej. agente `cursor`, suite `minimal` según el runner). Para controlar escenario y fixture, usa las variables de entorno descritas abajo.

## Variables de entorno

| Variable | Valores típicos | Descripción |
|----------|-----------------|-------------|
| `DOTAGENTS_E2E` | `1` | Activa el modo E2E (evita prompts interactivos). El runner lo fija automáticamente. |
| `DOTAGENTS_E2E_AGENT` | `cursor`, `opencode` | Agente bajo test. Por defecto: `cursor`. |
| `DOTAGENTS_E2E_SUITE` | `minimal`, `full` | Suite a ejecutar. `minimal` = smoke (comandos registrados); `full` = batería completa (sync bidireccional, etc.). Por defecto en el runner: `minimal`. |
| `DOTAGENTS_E2E_FIXTURE` | `newProjectWithCursor`, `newProjectWithOpencode` | Nombre del workspace fixture en `e2e/fixtures/`. Por defecto: `newProjectWithCursor`. |
| `DOTAGENTS_E2E_SYNC_DIRECTION` | `inbound`, `outbound` | Dirección de sync cuando aplique. Por defecto: `inbound`. |
| `DOTAGENTS_E2E_EXTENSION_PATH` | ruta absoluta | Carpeta de la extensión (por defecto el cwd del proceso que lanza los tests). Útil en CI o si ejecutas desde otro directorio. |

## Escenarios de ejemplo

**Minimal (smoke):**

```bash
cd apps/vscode
DOTAGENTS_E2E_SUITE=minimal DOTAGENTS_E2E_AGENT=cursor bun run test:e2e
```

**Full Cursor:**

```bash
cd apps/vscode
DOTAGENTS_E2E_AGENT=cursor DOTAGENTS_E2E_SUITE=full DOTAGENTS_E2E_FIXTURE=newProjectWithCursor bun run test:e2e
```

**Full OpenCode:**

```bash
cd apps/vscode
DOTAGENTS_E2E_AGENT=opencode DOTAGENTS_E2E_SUITE=full DOTAGENTS_E2E_FIXTURE=newProjectWithOpencode bun run test:e2e
```

## Modo debug (VS Code)

Puedes lanzar los E2E desde VS Code con la configuración de launch **"Extension E2E Tests"** (o **"Extension E2E Tests (OpenCode)"** si está definida):

1. Abre el workspace `apps/vscode` en VS Code.
2. Panel Run and Debug (Ctrl+Shift+D / Cmd+Shift+D).
3. Elige **Extension E2E Tests** y pulsa F5.

La configuración abre una segunda ventana (Extension Development Host) con el workspace del fixture y ejecuta la suite. Para cambiar agente, suite o fixture, edita el bloque `env` de esa configuración en [apps/vscode/.vscode/launch.json](../../../../apps/vscode/.vscode/launch.json) (p. ej. `DOTAGENTS_E2E_AGENT`, `DOTAGENTS_E2E_SUITE`, `DOTAGENTS_E2E_FIXTURE`).

## Ubicación de tests y fixtures

- **Runner:** [apps/vscode/e2e/runTest.ts](../../../../apps/vscode/e2e/runTest.ts)
- **Suite (punto de entrada):** [apps/vscode/e2e/suite/index.js](../../../../apps/vscode/e2e/suite/index.js)
- **Fixtures:** [apps/vscode/e2e/fixtures/](../../../../apps/vscode/e2e/fixtures/) (`newProjectWithCursor`, `newProjectWithOpencode`)
