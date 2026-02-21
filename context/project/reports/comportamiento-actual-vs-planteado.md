# Informe: Comportamiento actual vs. diseño planteado

**Fecha:** 2025-02-21
**Ámbito:** Extensión DotAgents VSCode / CLI — flujo de detección de herramienta y sincronización bidireccional

---

## 1. Resumen ejecutivo

Este documento describe el comportamiento actual de la extensión DotAgents y lo contrasta con el diseño planteado para soportar múltiples herramientas (IDEs, extensiones, TUIs) con selección explícita de herramienta activa, file watchers reactivos y sincronización manual bidireccional.

---

## 2. Especificación planteada

### 2.1 Flujo en 8 pasos

| # | Requisito planteado                    | Descripción                                                                                                                                                                                        |
| - | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | **Inicialización en apertura**  | Al abrir el IDE, detectar si existen `.agents` y `.agents/.ai`; si no existen, crearlos.                                                                                                        |
| 2 | **Selector de herramienta**      | Detectar nombre del IDE y mostrar un select list con check por defecto en el IDE actual. Permitir herramientas distintas al IDE (opencode CLI, Cline extensión, etc.).                             |
| 3 | **Evaluación de reglas**        | Si existen reglas para la herramienta → descargarlas a `.agents/.ai/rules`. Si no → indicar al usuario que las cree usando `make_rule.md` y las guarde en `.agents/.ai/rules/{{IDE}}.yaml`. Las reglas se definen en **formato YAML**. |
| 4 | **File watchers IDE ↔ .agents** | Escuchar cambios en archivos del IDE y de `.agents`. Cuando cambie algo → actualizar `.agents` y `.agents/.ai/state.json`. Solo modificar archivos que reporten cambios.                     |
| 5 | **Sync .agents → IDE**          | Cuando se modifica algo en `.agents`, aplicar reglas para llevar cambios del puente a la herramienta seleccionada.                                                                                |
| 6 | **Sincronización manual**       | Disparar sync manualmente: preguntar IDE y dirección (`.agents` → IDE o IDE → `.agents`).                                                                                                    |
| 7 | **Menú: cambiar herramienta**   | Permitir cambiar manualmente la herramienta activa desde el menú de la extensión.                                                                                                                 |
| 8 | **Nueva herramienta distinta**   | Al abrir un IDE cuyo nombre difiere de `manifest.currentAgent`, preguntar siempre qué herramienta usar.                                                                                          |

**Formato de reglas:** Las reglas por herramienta se definen en **YAML** (archivos `.yaml` en `.agents/.ai/rules/`).

### 2.2 Estructura de `state.json` (planteada)

- **manifest**: herramienta activa (`currentAgent`), timestamps por herramienta (`lastProcessedAt`), para saber cuál está más actualizada.
- **agents**: array para el select list con nombres de UI (`id`, `name`, `sourceRoot`).

### 2.3 Escenario ideal

Para una experiencia completa de cambio de herramienta, la extensión debe ofrecer:

1. **Cambio manual de herramienta**: Una forma explícita de indicar qué herramienta está activa (p. ej. menú u opción en el proyecto), persistida en `manifest.currentAgent`.
2. **Selección forzada al abrir un IDE distinto**: Si al abrir el workspace se detecta que el IDE actual es distinto de `manifest.currentAgent`, la extensión debe forzar la selección de herramienta antes de continuar, evitando asumir la herramienta anterior.

---

## 3. Comportamiento actual

### 3.1 Inicialización (Requisito 1)

| Aspecto                            | Estado | Detalle                                                                                                  |
| ---------------------------------- | ------ | -------------------------------------------------------------------------------------------------------- |
| Crear `.agents` si no existe     | ✅     | `InitializeProjectUseCase` crea la estructura vía `NodeConfigRepository.save()`.                    |
| Crear `.agents/.ai` si no existe | ✅     | `NodeConfigRepository.save()` y `ensureAIStructure()` crean `.agents/.ai` y `.agents/.ai/rules`. |
| Momento de ejecución              | ✅     | Solo cuando hay workspace abierto; se usa `onDidChangeWorkspaceFolders` si no hay carpeta al activar.  |

**Archivos:** `extension.ts` (instancia `InitializeProjectUseCase`), `NodeConfigRepository.ts`, `StartSyncOrchestration.ts` (llamada a `initializeProject.execute()` y `ensureAIStructure()`).

**Roadmap:** Ver `context/apps/vscode/dev/core-engine-integration/` para sprints y status detallado (Sprint 1: Inicialización).

---

### 3.2 Selector de herramienta (Requisito 2)

| Aspecto                                      | Estado | Detalle                                                                                                                                 |
| -------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Diálogo/select list para elegir herramienta | ✅     | QuickPick en `selectActiveAgent()` con lista de agentes desde `configRepository.load()`.                                            |
| Detección del IDE                           | ✅     | `detectAgentFromHostApp()` (`vscode.env.appName`) y `detectCurrentAgentFromWorkspace()` (carpetas `.cursor`, `.cline`, etc.). |
| Selección por el usuario                    | ✅     | El usuario elige en el QuickPick;`currentAgent` y `lastActiveAgent` se persisten en `.agents/.ai/state.json`.                     |
| Check por defecto en IDE actual              | ✅     | Se preselecciona IDE host o `manifest.currentAgent` según prioridad.                                                                 |

**Archivos:** `extension.ts`, `AgentHostDetector.ts`, `DiffSyncAdapter.ts`, `StartSyncOrchestration.ts`

---

### 3.3 Evaluación de reglas (Requisito 3)

| Aspecto                                        | Estado | Detalle                                                                                                        |
| ---------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------- |
| Descargar reglas desde repositorio             | ✅     | `FetchAndInstallRulesUseCase` obtiene reglas de GitHub y las guarda en `.agents/.ai/rules/{agentId}.yaml`. |
| Verificar existencia de reglas por herramienta | ✅     | `GetMissingRulesAgentIdsUseCase` usa `VerifyRulesExistenceUseCase` sobre `.agents/.ai/rules`; los IDs sin regla se notifican al usuario. |
| Guía para crear reglas faltantes              | ✅     | `make_rule.md` está poblado con una guía para crear reglas.                                                |
| Formato de reglas (YAML)                      | ✅     | Las reglas se escriben en formato YAML (extensión `.yaml`) en `.agents/.ai/rules/{agentId}.yaml`.       |
| Mensaje al usuario si faltan reglas            | ✅     | `showWarningMessage` con lista de agentes sin reglas y acción «Open make_rule.md»; integrado tras `fetchAndInstallRules` en `StartSyncOrchestration`. |

**Archivos:** `FetchAndInstallRulesUseCase.ts`, `GetMissingRulesAgentIdsUseCase.ts`, `GitHubRuleProvider.ts`, `extension.ts` (notificación), `StartSyncOrchestration.ts`, `.agents/.ai/rules/make_rule.md`

---

### 3.4 File watchers (Requisito 4)

| Aspecto                                  | Estado | Detalle                                                                                                        |
| ---------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------- |
| Escuchar cambios en archivos del IDE     | ✅     | `IdeWatcherService` observa source roots del IDE activo (`.cursor`, `.cline`, etc.) vía `createFileSystemWatcher`. |
| Escuchar cambios en `.agents`          | ✅     | `AgentsWatcherService` observa `.agents/[!.]*/**` (excluye `.agents/.ai/`) para evitar bucles.                   |
| Actualizar `.agents` cuando cambia IDE | ✅     | Watcher IDE dispara `runReactiveInboundSync` → `syncEngine.syncAgent` (IDE → `.agents`).                        |
| Actualizar `.agents/.ai/state.json`    | ✅     | `config.manifest.markAsSynced()` tras cada sync reactivo (inbound y outbound).                                  |
| Solo modificar archivos afectados        | ✅     | Sync incremental: watchers acumulan URIs afectadas como `affectedPaths`; DefaultSyncInterpreter procesa solo archivos afectados.   |

**Nota:** Se usa debounce (400 ms) para evitar ejecutar sync en cada keystroke.

**Archivos:** `IdeWatcherService.ts`, `AgentsWatcherService.ts`, `extension.ts`, `debounce.ts`

**Roadmap:** Ver `context/apps/vscode/dev/file-watchers/` para sprints y status detallado.

---

### 3.5 Sync .agents → IDE (Requisito 5)

| Aspecto                                  | Estado | Detalle                                                                                        |
| ---------------------------------------- | ------ | ---------------------------------------------------------------------------------------------- |
| Aplicar reglas cuando cambia `.agents` | ✅     | `AgentsWatcherService` dispara `runReactiveOutboundSync` → `syncEngine.syncOutboundAgent`.      |
| Dirección outbound (`.agents` → IDE) | ✅     | `DiffSyncAdapter.syncOutboundAgent()` usa `rule.mappings.outbound` (`.agents` → IDE).           |

**Archivos:** `DiffSyncAdapter.ts`, `AgentsWatcherService.ts`, `extension.ts`

---

### 3.6 Sincronización manual (Requisito 6)

| Aspecto                                         | Estado | Detalle                                                                 |
| ----------------------------------------------- | ------ | ----------------------------------------------------------------------- |
| Disparar sync manualmente                       | ✅     | Comando `dotagents-vscode.sync`.                                       |
| Elegir IDE en el diálogo                       | ✅     | Se muestra siempre el selector de herramienta primero (`selectActiveAgent`). |
| Elegir dirección (IDE→.agents / .agents→IDE) | ✅     | `showSyncDirectionPicker()` ofrece IDE→.agents (inbound) y .agents→IDE (outbound). |

**Flujo:** herramienta → dirección → sync. **Archivos:** `extension.ts`, `StartSyncOrchestration.ts`

**Roadmap:** Ver `context/apps/vscode/dev/sync-manual/` para sprints y status detallado.

---

### 3.7 Menú: cambiar herramienta (Requisito 7)

| Aspecto                                   | Estado | Detalle                                                                                       |
| ----------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| Opción en menú para cambiar herramienta | ✅     | «Configure Active Agents» abre el selector y persiste `currentAgent`/`lastActiveAgent`. |
| Opciones actuales                         | ⚠️   | Sync Now, Add Agent/IDE, Configure Active Agents, Generate Rules Prompt (no implementado).    |

**Archivos:** `extension.ts`

---

### 3.8 Preguntar al abrir IDE distinto (Requisito 8)

| Aspecto                                           | Estado | Detalle                                                                                 |
| ------------------------------------------------- | ------ | --------------------------------------------------------------------------------------- |
| Comparar IDE actual con `manifest.currentAgent` | ✅     | `StartSyncOrchestration` compara `hostAgentId` con `currentAgent` antes del sync. |
| Preguntar herramienta si difieren                 | ✅     | Si difieren o `currentAgent` es null, se muestra el selector antes de continuar.      |

**Archivos:** `StartSyncOrchestration.ts`, `AgentHostDetector.ts`

---

## 4. Estructura de `state.json`

### 4.1 Ubicación actual

- **Actual:** `.agents/.ai/state.json`
- **Planteado:** `.agents/.ai/state.json` (implícito en el diseño)

### 4.2 Estructura actual

```json
{
  "manifest": {
    "lastProcessedAt": 1771529966626,
    "lastActiveAgent": "cursor",
    "currentAgent": "cursor",
    "agents": {
      "antigravity": { "lastProcessedAt": 0 },
      "cursor": { "lastProcessedAt": 1771529966626 },
      "claude-code": { "lastProcessedAt": 0 },
      "cline": { "lastProcessedAt": 0 },
      "windsurf": { "lastProcessedAt": 0 },
      "opencode": { "lastProcessedAt": 0 },
      "agents": { "lastProcessedAt": 1771529966626 }
    }
  },
  "agents": [
    { "id": "cursor", "name": "cursor", "sourceRoot": ".cursor", "inbound": [], "outbound": [] },
    ...
  ]
}
```

### 4.3 Semántica (actual y planteada)

| Campo                        | Descripción                                                                                                |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `manifest.lastProcessedAt` | Timestamp global de última sincronización.                                                                |
| `manifest.lastActiveAgent` | Última herramienta que sincronizó.                                                                        |
| `manifest.currentAgent`    | Herramienta activa; se pregunta al usuario cuando IDE difiere o no hay valor definido.                      |
| `manifest.agents`          | `{ agentId: { lastProcessedAt } }` — timestamps por herramienta para saber cuál está más actualizada. |
| `agents`                   | Array para el selector de herramientas (`id`, `name`, `sourceRoot`, etc.).                            |

---

## 5. Diferencias principales

| Requisito                       | Actual                                   | Planteado                                    | Brecha                    |
| ------------------------------- | ---------------------------------------- | -------------------------------------------- | ------------------------- |
| Selector de herramienta         | UI QuickPick + check por defecto         | UI con select list y check por defecto       | Implementado.             |
| Reglas faltantes                | Mensaje al usuario + acción abrir `make_rule.md` | Mensaje al usuario +`make_rule.md` poblado | Implementado. |
| File watchers                   | IdeWatcherService + AgentsWatcherService | IDE ↔`.agents` reactivo                   | Implementado.             |
| Sync bidireccional              | IDE ↔`.agents` (inbound + outbound)      | IDE ↔`.agents`                            | Implementado.             |
| Sync manual con opciones        | Selector herramienta + picker dirección  | Elegir IDE y dirección                      | Implementado.            |
| Cambiar herramienta en menú    | Implementado (Configure Active Agents)   | Sí                                          | Implementado.             |
| Preguntar al abrir IDE distinto | Implementado                             | Sí si IDE ≠ currentAgent                   | Implementado.             |

---

## 6. Dependencias técnicas actuales

- **`@dotagents/diff`**: `SyncProjectUseCase`, `InitializeProjectUseCase`, `SyncManifest`, `Configuration`. Roadmap de integración: `context/apps/vscode/dev/core-engine-integration/`.
- **`@dotagents/rule`**: `ClientModule.createListInstalledRulesUseCase` para listar reglas en `.agents/.ai/rules`.
- **`NodeConfigRepository`**: `state.json` en `.agents/.ai/state.json`.
- **`FsAgentScanner`**: detección de agentes vía `WORKSPACE_KNOWN_AGENTS`.
- **`MigrateExistingAgentsToBridgeUseCase`**: migración IDE → `.agents` cuando `.agents` no existe.
- **`IdeWatcherService`**: file watcher para source roots del IDE activo; dispara sync inbound reactivo.
- **`AgentsWatcherService`**: file watcher para `.agents` (excl. `.agents/.ai/`); dispara sync outbound reactivo.

---

## 7. Recomendaciones para cerrar la brecha

1. **Paso 1:** ~~Implementar diálogo de selección de herramienta~~ (QuickPick implementado).
2. **Paso 2:** ~~Añadir opción en el menú para cambiar herramienta~~ («Configure Active Agents» implementado).
3. **Paso 3:** ~~Antes del primer sync, comparar IDE con `manifest.currentAgent`~~ (selector integrado en flujo inicial).
4. **Paso 4:** ~~Mostrar notificación cuando falten reglas~~ (implementado: `notifyMissingRules` en flujo de sync).
5. **Paso 5:** ~~Implementar `vscode.workspace.createFileSystemWatcher` para IDE y `.agents`~~ (implementado: `IdeWatcherService`, `AgentsWatcherService`).
6. **Paso 6:** ~~Añadir sync outbound (`.agents` → IDE)~~ (implementado: `syncOutboundAgent` en `DiffSyncAdapter`).
7. **Paso 7:** ~~Extender el comando de sync manual con diálogo para elegir dirección (IDE→.agents / .agents→IDE)~~ (implementado: `showSyncDirectionPicker`, orden herramienta→dirección→sync).
8. **Paso 8:** ~~Implementar sync incremental (solo archivos afectados)~~ (implementado: `affectedPaths` en `SyncProjectRequestDTO`, `DefaultSyncInterpreter.interpretIncremental`, acumulación de URIs en watchers).

---

## 8. Referencias de código

| Componente         | Ruta                                                                              |
| ------------------ | --------------------------------------------------------------------------------- |
| Entrada extensión | `apps/vscode/src/extension.ts`                                                  |
| Orquestador sync   | `apps/vscode/src/modules/orchestrator/app/StartSyncOrchestration.ts`             |
| Adapter sync       | `apps/vscode/src/modules/orchestrator/infra/DiffSyncAdapter.ts`                  |
| Watcher IDE        | `apps/vscode/src/modules/orchestrator/infra/IdeWatcherService.ts`                |
| Watcher .agents    | `apps/vscode/src/modules/orchestrator/infra/AgentsWatcherService.ts`             |
| Repositorio config | `apps/vscode/src/modules/orchestrator/infra/NodeConfigRepository.ts`             |
| Reglas             | `apps/vscode/src/modules/orchestrator/app/FetchAndInstallRulesUseCase.ts`        |
| Dominio agentes    | `apps/vscode/src/modules/orchestrator/domain/WorkspaceAgents.ts`                 |
| Inicialización     | `packages/diff/src/modules/config/app/use-cases/InitializeProjectUseCase.ts`     |
| SyncManifest       | `packages/diff/src/modules/config/domain/entities/SyncManifest.ts`               |
| Migración         | `apps/vscode/src/modules/orchestrator/app/MigrateExistingAgentsToBridgeUseCase.ts` |
