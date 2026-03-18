# VSCode Extension Architecture (@dotagents/vscode)

La extensión de VSCode actúa como el "agente de campo" que monitorea el entorno de desarrollo y coordina con los paquetes core (`@dotagents/diff` y `@dotagents/rule`) para mantener la sincronización en tiempo real.

## 1. Estructura de Módulos (Vertical Slices)

Siguiendo la arquitectura del proyecto, la lógica reside en `src/modules/`:

### 📂 `orchestrator` (El cerebro)
Gestiona el ciclo de vida de la sincronización y el estado global de la extensión.
- **Domain**:
  - `SyncState`: Entidad que rastrea si el workspace está sincronizado.
  - `Heartbeat`: Lógica para comparar timestamps de `sync.json`.
- **Application**:
  - `SyncProjectUseCase`: Orquestador principal que llama a `diff`.
  - `WatchWorkspaceUseCase`: Inicia los watchers de archivos.
- **Infrastructure**:
  - `VSCodeWatcher`: Implementación de `FileSystemWatcher` de VSCode.
  - `StatusBarManager`: Adaptador para la UI de la barra de estado.

### 📂 `agent-bridge` (El detector)
Interfaz con el paquete `@dotagents/rule` para manejar la identidad de los agentes.
- **Application**:
  - `DetectEnvironmentUseCase`: Identifica qué agentes tienen carpetas en el root.
  - `RulePromptUseCase`: Genera el prompt para nuevos agentes.
- **Infrastructure**:
  - `FileScanner`: Adaptador para buscar carpetas de configuración (`.cursor`, `.cline`, etc).

### 📂 `ui` (La experiencia Premium)
Maneja la interacción con el usuario.
- **Infrastructure**:
  - `NotificationProvider`: Mensajes elegantes y acciones (buttons).
  - `CommandRegistry`: Registro de comandos de VSCode.

## 2. Flujo de Operación (Runtime)

### A. Activación (Cold Start)
1. `DetectEnvironment` escanea el proyecto.
2. Si no existe `.agents`, pregunta al usuario si desea inicializar.
3. Si existe, verifica `sync.json` vs Timestamps locales de los agentes detectados.
4. Muestra estado en la Status Bar (ej: "• DotAgents: Synced").

### B. Sincronización Automática (The Loop)
1. **Watcher** detecta cambio en `.cursorrules` (Agente A).
2. `orchestrator` dispara Inbound Sync de A -> `.agents`.
3. Se actualiza `sync.json` con nuevo timestamp.
4. Si hay otros agentes activos (Agente B), se dispara Outbound Sync `.agents` -> Agente B.

### C. Modo Skill (Auto-Configuración)
1. Si se detecta un agente nuevo sin reglas en `.agents/.ai/rules/` (YAML del motor).
2. UI muestra notificación: "Nuevo agente detectado. ¿Quieres configurar sincronización?".
3. `RulePromptUseCase` abre un Editor Virtual con el prompt generado.

## 3. UI/UX Standards

- **StatusBar**: Color dinámico (Azul: Sincronizando, Verde: OK, Naranja: Cambio detectado).
- **Notificaciones**: Usar `vscode.window.withProgress` para que la sincronización no sea intrusiva pero sí visible.
- **Comandos**:
  - `dotagents.sync`: Forzar sincronización manual.
  - `dotagents.init`: Inicializar `.agents` universal bridge.
  - `dotagents.generateRule`: Crear regla para un agente desconocido.
