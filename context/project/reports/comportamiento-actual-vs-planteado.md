# Informe: Comportamiento actual vs. diseño planteado

**Fecha:** 2025-02-22
**Ámbito:** Extensión DotAgents VSCode / CLI — flujo de detección de herramienta y sincronización bidireccional

> **Cambios recientes (roadmap Agent Host Detector):** Valor por defecto `vscode`; `WORKSPACE_KNOWN_AGENTS` solo con agentes con reglas en GitHub (antigravity, cursor); detección dinámica por bucle; notificación cuando IDE no reconocido con opciones Add Agent / Open make_rule.md; placeholder en selector para IDEs no listados. Roadmap: `context/apps/vscode/dev/agent-host-detector/` (status.md).
>
> **Cambios recientes (roadmap Tool Change Sync):** `syncNew(workspaceRoot, agentId)` ejecuta outbound + inbound (full sync). Tras cambiar herramienta por selector o al añadir agente manualmente, se ejecuta `syncNew` si existen reglas; ignoredPaths y cooldowns evitan bucles. Add Agent Manually añade agente a config, persiste currentAgent y lanza syncNew. Roadmap: `context/apps/vscode/dev/tool-change-sync/` (status.md).
>
> **Cambios recientes (roadmap Known Agents from Rules):** `WORKSPACE_KNOWN_AGENTS` se genera en build desde `rules/*.yaml` (WorkspaceAgents.generated.ts). En runtime el selector incluye agentes de `.agents/.ai/rules/*.yaml` (reglas custom) fusionados sin duplicados. Add Agent Manually usa la misma lista dinámica (conocidos + custom) y opción "Custom...". Roadmap: `context/apps/vscode/dev/known-agents-from-rules/` (status.md).

---

## 1. Resumen ejecutivo

Este documento describe el comportamiento actual de la extensión DotAgents y lo contrasta con el diseño planteado para soportar múltiples herramientas (IDEs, extensiones, TUIs) con selección explícita de herramienta activa, file watchers reactivos y sincronización manual bidireccional.

---

## 2. Especificación planteada

### 2.1 Flujo en 8 pasos


| #   | Requisito planteado             | Descripción                                                                                                                                                                                                                            |
| --- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Inicialización en apertura**  | Al abrir el IDE, detectar si existen `.agents` y `.agents/.ai`; si no existen, crearlos.                                                                                                                                               |
| 2   | **Selector de herramienta**     | Detectar nombre del IDE y mostrar un select list con check por defecto en el IDE actual. Permitir herramientas distintas al IDE (opencode CLI, Cline extensión, etc.).                                                                 |
| 3   | **Evaluación de reglas**        | Si existen reglas para la herramienta → descargarlas a `.agents/.ai/rules`. Si no → indicar al usuario que las cree usando `make_rule.md` y las guarde en `.agents/.ai/rules/{{IDE}}.yaml`. Las reglas se definen en **formato YAML**. |
| 4   | **File watchers IDE ↔ .agents** | Escuchar cambios en archivos del IDE y de `.agents`. Cuando cambie algo → actualizar `.agents` y `.agents/.ai/state.json`. Solo modificar archivos que reporten cambios.                                                               |
| 5   | **Sync .agents → IDE**          | Cuando se modifica algo en `.agents`, aplicar reglas para llevar cambios del puente a la herramienta seleccionada.                                                                                                                     |
| 6   | **Sincronización manual**       | Disparar sync manualmente: preguntar IDE y dirección (`.agents` → IDE o IDE → `.agents`).                                                                                                                                              |
| 7   | **Menú: cambiar herramienta**   | Permitir cambiar manualmente la herramienta activa desde el menú de la extensión.                                                                                                                                                      |
| 8   | **Nueva herramienta distinta**  | Al abrir un IDE cuyo nombre difiere de `manifest.currentAgent`, preguntar siempre qué herramienta usar.                                                                                                                                |


**Formato de reglas:** Las reglas por herramienta se definen en **YAML** (archivos `.yaml` en `.agents/.ai/rules/`).

### 2.2 Estructura de `state.json` (planteada)

- **manifest**: herramienta activa (`currentAgent`), timestamps por herramienta (`lastProcessedAt`), para saber cuál está más actualizada.
- **agents**: array para el select list con nombres de UI (`id`, `name`, `sourceRoot`).

### 2.3 Escenario ideal

Para una experiencia completa de cambio de herramienta, la extensión debe ofrecer:

1. **Cambio manual de herramienta**: Una forma explícita de indicar qué herramienta está activa (p. ej. menú u opción en el proyecto), persistida en `manifest.currentAgent`.
2. **Selección forzada al abrir un IDE distinto**: Si al abrir el workspace se detecta que el IDE actual es distinto de `manifest.currentAgent`, la extensión debe forzar la selección de herramienta antes de continuar, evitando asumir la herramienta anterior.

### 2.4 Reglas de negocio: herramienta y reglas

El flujo debe respetar estas condiciones obligatorias:

| Estado   | Requisito                                   | Descripción                                                                                                                                                        |
| -------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ✅       | **Herramienta definida obligatoriamente**   | No avanzar (no migrar, no sincronizar) hasta que el usuario haya seleccionado herramienta. Si cancela o no selecciona, esperar sin ejecutar migración ni sync.    |
| ❌       | **Paso 2 = selección + descarga de reglas** | Tras elegir herramienta → descargar sus reglas a `.agents/.ai/rules/{agentId}.yaml`. Las reglas descargadas se usan en sync y migración.                           |
| ❌       | **Sincronizar solo con reglas locales**     | No ejecutar sync ni migración si no existe `.agents/.ai/rules/{agentId}.yaml` para la herramienta activa. No usar `DEFAULT_MIGRATION_RULES`.                       |
| ⚠️       | **Reglas inexistentes en GitHub**           | Notificación con `make_rule.md` implementada. Pendiente: bloquear sync hasta que las reglas existan localmente.                                                    |

*Leyenda Estado: ✅ Hecho | ❌ Pendiente | ⚠️ Parcial*

**Orden resumido:** herramienta definida → reglas en local → sync/migración.

---

## 3. Comportamiento actual

### 3.1 Inicialización (Requisito 1)


| Aspecto                          | Estado | Detalle                                                                                               |
| -------------------------------- | ------ | ----------------------------------------------------------------------------------------------------- |
| Crear `.agents` si no existe     | ✅      | `InitializeProjectUseCase` crea la estructura vía `NodeConfigRepository.save()`.                      |
| Crear `.agents/.ai` si no existe | ✅      | `NodeConfigRepository.save()` y `ensureAIStructure()` crean `.agents/.ai` y `.agents/.ai/rules`.      |
| Revisar `state.json` al abrir    | ✅      | Si no existe, el flujo contempla selector/inicialización; si `currentAgent` es null o ≠ `hostAgentId`, se abre el selector. |
| Momento de ejecución             | ✅      | Solo cuando hay workspace abierto; se usa `onDidChangeWorkspaceFolders` si no hay carpeta al activar. |


**Archivos:** `extension.ts` (instancia `InitializeProjectUseCase`), `NodeConfigRepository.ts`, `StartSyncOrchestration.ts` (llamada a `initializeProject.execute()` y `ensureAIStructure()`).

**Roadmap:** Ver `context/apps/vscode/dev/core-engine-integration/` para sprints y status detallado (Sprint 1: Inicialización).

---

### 3.2 Selector de herramienta (Requisito 2)


| Aspecto                                     | Estado | Detalle                                                                                                                       |
| ------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Diálogo/select list para elegir herramienta | ✅      | QuickPick en `selectActiveAgent()` con lista dinámica: `WORKSPACE_KNOWN_AGENTS` (build desde `rules/`) + agentes de `.agents/.ai/rules/*.yaml` (reglas custom), sin duplicados. |
| Detección del IDE                           | ✅      | `detectAgentFromHostApp()` usa bucle sobre `WORKSPACE_KNOWN_AGENTS`; fallback `"vscode"` si no coincide.                      |
| Selección por el usuario                    | ✅      | El usuario elige en el QuickPick; `currentAgent` y `lastActiveAgent` se persisten en `.agents/.ai/state.json`.                |
| Check por defecto en IDE actual             | ✅      | Se preselecciona IDE host o `manifest.currentAgent` según prioridad.                                                          |
| Abrir selector si currentAgent ≠ hostAgentId | ✅     | Si `currentAgent` es null o distinto de `hostAgentId`, se abre el selector antes de continuar (Requisito 8).                  |
| Placeholder para IDE no reconocido          | ✅      | Si `hostAgentId === 'vscode'` y `!isHostIdeRecognized()`, placeholder: "Tu IDE ({appName}) no está en la lista. Usa Add Agent Manually…". |
| Add Agent Manually (lista dinámica)         | ✅      | Lista = conocidos (WORKSPACE_KNOWN_AGENTS) + reglas custom; opción "Custom...". Al añadir agente se persiste en config y se ejecuta `syncNew` si hay reglas locales. |


**Archivos:** `extension.ts`, `AgentHostDetector.ts`, `DiffSyncAdapter.ts`, `StartSyncOrchestration.ts`

---

### 3.3 Evaluación de reglas (Requisito 3)


| Aspecto                                        | Estado | Detalle                                                                                                                                               |
| ---------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Descargar reglas desde repositorio             | ✅      | `FetchAndInstallRulesUseCase` obtiene reglas de GitHub y las guarda en `.agents/.ai/rules/{agentId}.yaml`.                                            |
| Verificar existencia de reglas por herramienta | ✅      | `GetMissingRulesAgentIdsUseCase` usa `VerifyRulesExistenceUseCase` sobre `.agents/.ai/rules`; los IDs sin regla se notifican al usuario.              |
| Guía para crear reglas faltantes               | ✅      | `make_rule.md` está poblado con una guía para crear reglas.                                                                                           |
| Formato de reglas (YAML)                       | ✅      | Las reglas se escriben en formato YAML (extensión `.yaml`) en `.agents/.ai/rules/{agentId}.yaml`.                                                     |
| Mensaje al usuario si faltan reglas            | ✅      | `showWarningMessage` con lista de agentes sin reglas y acción «Open make_rule.md»; integrado tras `fetchAndInstallRules` en `StartSyncOrchestration`. |


**Archivos:** `FetchAndInstallRulesUseCase.ts`, `GetMissingRulesAgentIdsUseCase.ts`, `GitHubRuleProvider.ts`, `extension.ts` (notificación), `StartSyncOrchestration.ts`, `.agents/.ai/rules/make_rule.md`

---

### 3.4 File watchers (Requisito 4)


| Aspecto                                | Estado | Detalle                                                                                                                          |
| -------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Escuchar cambios en archivos del IDE   | ✅      | `IdeWatcherService` observa source roots del IDE activo (`.cursor`, `.cline`, etc.) vía `createFileSystemWatcher`.               |
| Escuchar cambios en `.agents`          | ✅      | `AgentsWatcherService` observa `.agents/[!.]*/`** (excluye `.agents/.ai/`) para evitar bucles.                                   |
| Actualizar `.agents` cuando cambia IDE | ✅      | Watcher IDE dispara `runReactiveInboundSync` → `syncEngine.syncAgent` (IDE → `.agents`).                                         |
| Actualizar `.agents/.ai/state.json`    | ✅      | `config.manifest.markAsSynced()` tras cada sync reactivo (inbound y outbound).                                                   |
| Solo modificar archivos afectados      | ✅      | Sync incremental: watchers acumulan URIs afectadas como `affectedPaths`; DefaultSyncInterpreter procesa solo archivos afectados. |


**Nota:** Se usa debounce (400 ms) para evitar ejecutar sync en cada keystroke.

**Archivos:** `IdeWatcherService.ts`, `AgentsWatcherService.ts`, `extension.ts`, `debounce.ts`

**Roadmap:** Ver `context/apps/vscode/dev/file-watchers/` para sprints y status detallado.

---

### 3.5 Sync .agents → IDE (Requisito 5)


| Aspecto                                | Estado | Detalle                                                                                    |
| -------------------------------------- | ------ | ------------------------------------------------------------------------------------------ |
| Aplicar reglas cuando cambia `.agents` | ✅      | `AgentsWatcherService` dispara `runReactiveOutboundSync` → `syncEngine.syncOutboundAgent`. |
| Dirección outbound (`.agents` → IDE)   | ✅      | `DiffSyncAdapter.syncOutboundAgent()` usa `rule.mappings.outbound` (`.agents` → IDE).      |


**Archivos:** `DiffSyncAdapter.ts`, `AgentsWatcherService.ts`, `extension.ts`

---

### 3.6 Sincronización manual (Requisito 6)


| Aspecto                                      | Estado | Detalle                                                                            |
| -------------------------------------------- | ------ | ---------------------------------------------------------------------------------- |
| Disparar sync manualmente                    | ✅      | Comando `dotagents-vscode.sync`.                                                   |
| Elegir IDE en el diálogo                     | ✅      | Se muestra siempre el selector de herramienta primero (`selectActiveAgent`).       |
| Elegir dirección (IDE→.agents / .agents→IDE) | ✅      | `showSyncDirectionPicker()` ofrece IDE→.agents (inbound) y .agents→IDE (outbound). |


**Flujo:** herramienta → dirección → sync. **Archivos:** `extension.ts`, `StartSyncOrchestration.ts`

**Roadmap:** Ver `context/apps/vscode/dev/sync-manual/` para sprints y status detallado.

---

### 3.7 Menú: cambiar herramienta (Requisito 7)


| Aspecto                                 | Estado | Detalle                                                                                    |
| --------------------------------------- | ------ | ------------------------------------------------------------------------------------------ |
| Opción en menú para cambiar herramienta | ✅      | «Configure Active Agents» abre el selector y persiste `currentAgent`/`lastActiveAgent`.    |
| Sync new tras cambiar herramienta       | ✅      | Tras `selectActiveAgent`, si hay reglas para la herramienta se ejecuta `syncNew` bidireccional; si no, se mantiene el guard (p. ej. status bar «Reglas faltantes»). Orden: regla → herramienta. |
| Opciones actuales                       | ⚠️     | Sync Now, Add Agent/IDE, Configure Active Agents, Generate Rules Prompt (no implementado). |


**Archivos:** `extension.ts`

---

### 3.8 Preguntar al abrir IDE distinto (Requisito 8)


| Aspecto                                         | Estado | Detalle                                                                           |
| ----------------------------------------------- | ------ | --------------------------------------------------------------------------------- |
| Comparar IDE actual con `manifest.currentAgent` | ✅      | `StartSyncOrchestration` compara `hostAgentId` con `currentAgent` antes del sync. |
| Preguntar herramienta si difieren               | ✅      | Si `currentAgent` es null o distinto de `hostAgentId`, se abre el selector.       |
| Valor por defecto                               | ✅      | Fallback de detección es `"vscode"`; no se asume `"cursor"`.                      |


**Archivos:** `StartSyncOrchestration.ts`, `AgentHostDetector.ts`

---

### 3.9 Agent Host Detector (IDEs reconocidos)


| Aspecto                               | Estado | Detalle                                                                                                                                         |
| ------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| IDEs reconocidos solo con reglas      | ✅      | `WORKSPACE_KNOWN_AGENTS` incluye solo agentes con reglas en GitHub: `antigravity`, `cursor`.                                                    |
| Detección dinámica                    | ✅      | `detectAgentFromHostApp()` itera sobre `WORKSPACE_KNOWN_AGENTS`; si no coincide, devuelve `"vscode"`.                                           |
| IDE no reconocido                     | ✅      | `isHostIdeRecognized()`: true si `appName` incluye algún agent.id o "vscode"/"visual studio code"; si no → IDE no soportado (Windsurf, Cline, etc.). |
| Notificación IDE no soportado         | ✅      | `notifyUnrecognizedIde()`: una vez por sesión, si IDE no reconocido, mensaje con acciones "Add Agent" y "Open make_rule.md".                    |


**Archivos:** `AgentHostDetector.ts` (detectAgentFromHostApp, isHostIdeRecognized, getHostAppName), `extension.ts` (notifyUnrecognizedIde, setupWatchers)

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
      "cursor": { "lastProcessedAt": 1771529966626 }
    }
  },
  "agents": [
    { "id": "cursor", "name": "cursor", "sourceRoot": ".cursor", "inbound": [], "outbound": [] },
    ...
  ]
}
```

**Cambios aplicados / planeados:**
- `manifest.agents` contiene solo agentes con reglas en GitHub (`antigravity`, `cursor`). La clave `manifest.agents.agents` es redundante y se elimina (Sprint 5).
- **sourceRoot y paths:** `agents[].sourceRoot` puede derivarse del primer path con `scope: "workspace"` y `purpose: "marker"` o `"sync_source"` cuando las reglas YAML usan `paths`; se mantiene por compatibilidad con consumidores que solo leen `sourceRoot`.

### 4.3 Semántica (actual y planteada)


| Campo                      | Descripción                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `manifest.lastProcessedAt` | Timestamp global de última sincronización.                                                            |
| `manifest.lastActiveAgent` | Última herramienta que sincronizó.                                                                    |
| `manifest.currentAgent`    | Herramienta activa; se pregunta al usuario cuando IDE difiere o no hay valor definido.                |
| `manifest.agents`          | `{ agentId: { lastProcessedAt } }` — timestamps por herramienta para saber cuál está más actualizada. |
| `agents`                   | Array para el selector de herramientas (`id`, `name`, `sourceRoot`, etc.). Puede incluir opcionalmente `paths` (array de objetos con path, scope, type, purpose); cuando existe, `sourceRoot` se deriva de `paths` para la UI y el sync. |


---

## 4.5 Cambios de comportamiento (Agent Host Detector)

| Índice | Cambio                                                                                    |
| :----: | ----------------------------------------------------------------------------------------- |
| 1      | Valor por defecto de detección es `vscode`, no `cursor`.                                  |
| 2      | Solo se reconocen IDEs con reglas en GitHub (`antigravity`, `cursor`).                    |
| 3      | Si `currentAgent` es null o distinto de `hostAgentId`, se abre el selector.               |
| 4      | Si el IDE no está reconocido, se notifica con opciones Add Agent / Open make_rule.md.     |
| 5      | Placeholder en selector cuando el IDE no está en la lista.                                |
| 6      | Se elimina `manifest.agents.agents` redundante (Sprint 5).                                |
| 7      | **Paths como array:** Migración de `source_root` / `configPath` / `workspaceMarker` únicos al modelo `paths` (array de objetos con path, scope, type, purpose). Reglas YAML y `WORKSPACE_KNOWN_AGENTS` soportan `paths`; detección (FsAgentScanner), watchers (IdeWatcherService) y sync usan paths con purpose marker/sync_source. Ver `context/project/reports/source_filePath.md` y `context/pkg/rule/doc/rule.md`. |

### 4.6 Cambios de comportamiento (Tool Change Sync y Known Agents from Rules)

| Índice | Cambio                                                                                    |
| :----: | ----------------------------------------------------------------------------------------- |
| 1      | **Sync new bidireccional:** Al cambiar herramienta (selector o Add Agent) se ejecuta `syncNew(workspaceRoot, agentId)` (outbound + inbound) si existen reglas; si no, no sync (guard existente). |
| 2      | **Known agents en build:** `WORKSPACE_KNOWN_AGENTS` se genera desde `rules/*.yaml` (WorkspaceAgents.generated.ts); solo agentes con reglas publicadas. |
| 3      | **Selector en runtime:** Incluye agentes de `.agents/.ai/rules/*.yaml` (custom) fusionados con conocidos; Add Agent Manually usa la misma lista dinámica y "Custom...". |

---

## 5. Diferencias principales


| Requisito                       | Actual                                           | Planteado                                  | Brecha        |
| ------------------------------- | ------------------------------------------------ | ------------------------------------------ | ------------- |
| Selector de herramienta         | UI QuickPick + check por defecto                 | UI con select list y check por defecto     | Implementado. |
| Reglas faltantes                | Mensaje al usuario + acción abrir `make_rule.md` | Mensaje al usuario +`make_rule.md` poblado | Implementado. |
| File watchers                   | IdeWatcherService + AgentsWatcherService         | IDE ↔`.agents` reactivo                    | Implementado. |
| Sync bidireccional              | IDE ↔`.agents` (inbound + outbound)              | IDE ↔`.agents`                             | Implementado. |
| Sync manual con opciones        | Selector herramienta + picker dirección          | Elegir IDE y dirección                     | Implementado. |
| Cambiar herramienta en menú     | Implementado (Configure Active Agents)           | Sí                                         | Implementado. |
| Preguntar al abrir IDE distinto | Implementado                                     | Sí si IDE ≠ currentAgent                   | Implementado. |


---

## 6. Dependencias técnicas actuales

- `**@dotagents/diff**`: `SyncProjectUseCase`, `InitializeProjectUseCase`, `SyncManifest`, `Configuration`. Roadmap de integración: `context/apps/vscode/dev/core-engine-integration/`.
- `**@dotagents/rule**`: `ClientModule.createListInstalledRulesUseCase` para listar reglas en `.agents/.ai/rules`.
- `**NodeConfigRepository**`: `state.json` en `.agents/.ai/state.json`.
- `**WORKSPACE_KNOWN_AGENTS**`: generado en build desde `rules/*.yaml` (solo agentes con reglas en el repo); en runtime el selector combina estos con agentes de `.agents/.ai/rules/*.yaml` (reglas custom). Usa el modelo `paths` (PathEntry[]) con helpers `getWorkspaceMarker`, `getConfigPath`, `getSyncSourcePaths`; detección y watchers se basan en esos paths.
- **Reglas YAML** (`.agents/.ai/rules/*.yaml`): usan el esquema `paths` cuando están migradas; especificación en `context/pkg/rule/doc/rule.md`.
- `**FsAgentScanner**`: detección de agentes vía `WORKSPACE_KNOWN_AGENTS`.
- `**AgentHostDetector**`: `detectAgentFromHostApp()` (fallback `"vscode"`), `isHostIdeRecognized()`, `getHostAppName()`.
- `**MigrateExistingAgentsToBridgeUseCase**`: migración IDE → `.agents` cuando `.agents` no existe.
- `**IdeWatcherService**`: file watcher para source roots del IDE activo; dispara sync inbound reactivo.
- `**AgentsWatcherService**`: file watcher para `.agents` (excl. `.agents/.ai/`); dispara sync outbound reactivo.

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


| Componente              | Ruta                                                                               |
| ----------------------- | ---------------------------------------------------------------------------------- |
| Entrada extensión       | `apps/vscode/src/extension.ts`                                                     |
| Orquestador sync        | `apps/vscode/src/modules/orchestrator/app/StartSyncOrchestration.ts`               |
| Adapter sync            | `apps/vscode/src/modules/orchestrator/infra/DiffSyncAdapter.ts`                    |
| Agent Host Detector     | `apps/vscode/src/modules/orchestrator/infra/AgentHostDetector.ts`                  |
| Watcher IDE             | `apps/vscode/src/modules/orchestrator/infra/IdeWatcherService.ts`                  |
| Watcher .agents         | `apps/vscode/src/modules/orchestrator/infra/AgentsWatcherService.ts`               |
| Repositorio config      | `apps/vscode/src/modules/orchestrator/infra/NodeConfigRepository.ts`               |
| Reglas                  | `apps/vscode/src/modules/orchestrator/app/FetchAndInstallRulesUseCase.ts`          |
| Dominio agentes         | `apps/vscode/src/modules/orchestrator/domain/WorkspaceAgents.ts`                   |
| Inicialización          | `packages/diff/src/modules/config/app/use-cases/InitializeProjectUseCase.ts`       |
| SyncManifest            | `packages/diff/src/modules/config/domain/entities/SyncManifest.ts`                 |
| Migración               | `apps/vscode/src/modules/orchestrator/app/MigrateExistingAgentsToBridgeUseCase.ts` |

**Roadmaps aplicados (status en cada `status.md`):**

| Roadmap | Ubicación | Contenido |
| ------- | --------- | --------- |
| Agent Host Detector | `context/apps/vscode/dev/agent-host-detector/` | Known agents solo GitHub; AgentHostDetector dinámico (fallback vscode); IDE no reconocido (notificación + Add Agent / make_rule). |
| Tool Change Sync | `context/apps/vscode/dev/tool-change-sync/` | Sync new bidireccional; Add Agent Manual flow (config + syncNew); integración en cambio de herramienta (onAfterSave → syncNew si hay reglas). |
| Known Agents from Rules | `context/apps/vscode/dev/known-agents-from-rules/` | Build: generar WORKSPACE_KNOWN_AGENTS desde rules/; runtime: selector con reglas custom (.agents/.ai/rules); Add Agent Manually con lista dinámica. |


