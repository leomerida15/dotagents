# Pruebas E2E – Extensión DotAgents VSCode

Los tests E2E ejecutan la extensión en una ventana de **Extension Development Host** y verifican el comportamiento real (comandos, reglas, sync).

## Ubicación

- **Tests y runner:** `apps/vscode/e2e/`
- **Suite (Mocha):** `apps/vscode/e2e/suite/`
- **Fixtures (workspaces de prueba):** `apps/vscode/e2e/fixtures/`

## Cómo ejecutar los E2E

Desde la raíz del monorepo o desde `apps/vscode`:

```bash
cd apps/vscode
bun run test:e2e
```

El script compila la extensión (`bun run build`) y luego lanza el Extension Development Host con el workspace `e2e/fixtures/newProjectWithCursor` y ejecuta el suite. Se descargará una copia de VS Code la primera vez si hace falta.

En modo E2E, el runner fija variables de entorno para evitar interacción humana en la UI:

- `DOTAGENTS_E2E=1`: desactiva prompts informativos que no son parte del assert del test.
- `DOTAGENTS_E2E_AGENT=cursor`: selecciona agente automáticamente en flujos que normalmente abren picker.
- `DOTAGENTS_E2E_SYNC_DIRECTION=inbound`: selecciona dirección de sync automáticamente cuando el comando `dotagents-vscode.sync` abriría QuickPick.

Adicionalmente, los tests de `apps/vscode/e2e/suite/` controlan por código las interacciones UI necesarias (QuickPick, InputBox, Warning/Info) para que la ejecución sea no-interactiva.

## Ruta canónica de reglas

- La ruta canónica para reglas de agente instaladas/descargadas es `.agents/rules/{agentId}.yaml`.
- Los tests E2E deben afirmar que los YAML de regla no se escriben en `.agents/.ai/rules/`.

**Requisitos:** No tener otra instancia de VS Code en ejecución con la misma versión que use el test (o usar Insiders para desarrollar y dejar que los tests usen Stable).

## Depurar los E2E

1. Abre el workspace desde `apps/vscode` (raíz de la extensión).
2. En **Run and Debug**, elige:
   - **"Extension E2E Tests"**: abre el fixture `e2e/fixtures/newProjectWithCursor` y ejecuta todos los tests (recomendado para validar la batería).
   - **"Extension E2E Tests (supabase-kit / Cursor)"**: abre la carpeta `../supabase-kit` (mismo nivel que `apps/vscode`, p. ej. otro repo o monorepo). Úsalo para probar la extensión contra un proyecto real o en Cursor; los tests se ejecutan en ese workspace (algunos pueden fallar si el proyecto ya tiene `.agents` o distinto estado).
3. Inicia la sesión: se abrirá una segunda ventana con el workspace elegido y se ejecutarán los tests; puedes poner breakpoints en `e2e/suite/*.js`.

## Roadmap y sprints

Ver [status.md](status.md) y los archivos `sprint-*.md` en este directorio.
