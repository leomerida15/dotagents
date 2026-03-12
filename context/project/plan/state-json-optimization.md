# Plan de Optimización para state.json

## Objetivo
Eliminar los cambios innecesarios en `.agents/.ai/state.json` que causan ruido en Git, manteniendo únicamente los cambios cuando:
1. Se selecciona una herramienta/agente diferente a la actual
2. Hay cambios reales en los archivos durante la sincronización

## Antecedentes
El archivo `state.json` almacena el estado de sincronización incluyendo:
- `lastProcessedAt`: Timestamp del puente .agents
- `lastActiveAgent`: Último agente que se sincronizó
- `currentAgent`: Agente actualmente activo
- Timestamps individuales por agente

Cada operación de sincronización llamaba a `markAsSynced()` que actualizaba SIEMPRE todos estos campos, causando cambios constantes incluso cuando:
- No había cambios reales en archivos (solo latidos/heartbeats)
- Se sincronizaba el mismo agente múltiples veces
- Se realizaban sincronizaciones salientes (que no deberían afectar el estado del puente)

## Solución Arquitectónica

### 1. Evolución del Dominio SyncManifest
Mantener `markAsSynced()` para compatibilidad hacia atrás pero agregar dos nuevos métodos más específicos:

#### Nuevo: `updateAgentTrackOnly(agentId: string)`
- Propósito: Actualizar únicamente el seguimiento de un agente específico
- Efectos:
  - Actualiza el timestamp del agente especificado
  - Actualiza `lastActiveAgentId` para seguimiento
  - NO modifica `lastProcessedAtValue` (estado del puente)
  - NO modifica `currentAgentId`
- Casos de uso:
  - Sincronizaciones salientes (bridge → agent)
  - Actualizaciones de latido cuando no hay cambios y mismo agente

#### Nuevo: `updateBridgeState(agentId: string, force: boolean = false)`
- Propósito: Actualizar el estado central del puente .agents
- Efectos (solo cuando se cumple la condición):
  - Actualiza `lastProcessedAtValue` al tiempo actual
  - Establece `currentAgentId` = agentId
  - Establece `lastActiveAgentId` = agentId
  - Actualiza el timestamp del agente especificado para que coincida con el puente
- Condición de actualización: `force === true` OR `agentId !== currentAgentId`
- Casos de uso:
  - Cuando hay cambios reales en archivos (`force = true`)
  - Cuando se cambia a un agente diferente

### 2. Modificaciones en Casos de Uso

#### SynchronizeAgentUseCase
- Cargar configuración actual
- Ejecutar sincronización entrante y saliente
- Determinar si hubo cambios reales (`result.actionsPerformed.length > 0`)
- Determinar si cambió el agente (`agentId !== currentAgent`)
- Aplicar lógica:
  ```typescript
  if (huboCambiosReal || cambioDeAgente) {
      manifest.updateBridgeState(agentId, huboCambiosReal);
  } else {
      manifest.updateAgentTrackOnly(agentId);
  }
  ```

#### PullOutboundUseCase
- Siempre usar `updateAgentTrackOnly(agentId)` ya que:
  - Es sincronización saliente (bridge → agent)
  - No modifica el estado del puente por definición
  - Solo necesita actualizar el seguimiento del agente destino

#### DiffSyncAdapter
- **syncAgent()**: Aplicar lógica condicional idéntica a SynchronizeAgentUseCase
- **syncOutboundAgent()**: Usar exclusivamente `updateAgentTrackOnly()`
- **syncAll()**: Mantener comportamiento actual (siempre actualizar bridge state con force=true) ya que es una operación explícita de sincronización completa

### 3. Solución Complementaria para Usuarios
Implementar en la extensión de VSCode un mecanismo que:
- Durante la activación o al abrir un workspace
- Verifique si `.gitignore` existe en la raíz
- Si no existe, crear uno con reglas básicas incluyendo:
  ```
  # generated/runtime files that should not be committed
  .agents/.ai/extension-debug.log
  .agents/.ai/state.json
  ```
- Si existe, verificar si contiene la regla para `state.json` y agregarla si falta
- Esto garantiza que incluso si persisten algunos cambios menores, no aparecerán en Git

## Fases de Implementación

### Fase 1: Preparación (1 día)
- [ ] Revisar todos los lugares donde se llama a `markAsSynced()`
- [ ] Crear rama de funcionalidad: `feature/state-json-optimization`
- [ ] Asegurar cobertura de pruebas existente para SyncManifest

### Fase 2: Cambios en Dominio (1-2 días)
- [ ] Añadir `updateAgentTrackOnly()` a SyncManifest
- [ ] Añadir `updateBridgeState()` a SyncManifest
- [ ] Mantener `markAsSynced()` sin cambios (para compatibilidad)
- [ ] Actualizar documentación JSDoc de los nuevos métodos
- [ ] Ejecutar pruebas unitarias existentes para asegurar no regressions

### Fase 3: Actualización de Casos de Uso (2-3 días)
- [ ] Modificar SynchronizeAgentUsease.ts
- [ ] Modificar PullOutboundUseCase.ts
- [ ] Modificar DiffSyncAdapter.ts (todos los métodos afectados)
- [ ] Ejecutar pruebas unitarias de los casos de uso modificados
- [ ] Ejecutar pruebas de integración relacionadas con sincronización

### Fase 4: Pruebas y Validación (2 días)
- [ ] Escribir pruebas unitarias específicas para los nuevos métodos:
  - Verificar que `updateAgentTrackOnly()` no modifica estado del puente
  - Verificar que `updateBridgeState()` solo actualiza cuando es apropiado
  - Verificar comportamiento condicional en SynchronizeAgentUseCase
- [ ] Probar manualmente escenarios clave:
  - Sincronización sin cambios, mismo agente → solo tracking actualizado
  - Sincronización con cambios → bridge state actualizado
  - Cambio de agente → bridge state actualizado
  - Sincronización saliente → solo tracking actualizado
- [ ] Verificar que `state.json` ya no cambia en operaciones innecesarias

### Fase 5: Solución de Gitignore (1 día)
- [ ] Implementar función en extension.ts para asegurar state.json en .gitignore
- [ ] O crear documentación clara para que usuarios lo agreguen manualmente
- [ ] Probar en workspaces nuevos y existentes

### Fase 6: Revisión y Merge (1 día)
- [ ] Revisión de código por pares
- [ ] Actualizar documentación de arquitectura si es necesario
- [ ] Merge a rama principal
- [ ] Crear release notes explicando la mejora

## Métricas de Éxito
Después de la implementación, se debería observar:
1. Reducción significativa en cambios no deseados de `state.json` en repositorios de usuarios
2. `state.json` solo cambia cuando:
   - Se ejecuta `syncAll()` (operación explícita)
   - Se cambia a un agente diferente
   - Hay diferencias reales detectadas durante sincronización entrante/saliente
3. Las pruebas unitarias y de integración pasan al 100%
4. No se reportan regressions en funcionalidad de sincronización

## Riesgos y Mitigaciones
| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Regression en funcionalidad de sincronización | Baja | Alto | Cobertura extensa de pruebas unitarias + integración |
| Usuarios que dependen del comportamiento anterior de markAsSynced() | Muy Baja | Medio | Mantener markAsSynced() sin cambios para compatibilidad |
| Conflictos con .gitignore existente | Baja | Bajo | Implementación cuidadosa que solo agrega si falta la regla |
| Sobre-engineering de la solución | Baja | Bajo | Enfoque minimalista centrado en los casos de uso reales |

## Próximos Pasos
1. Aprobar este plan de implementación
2. Asignar desarrollador responsable
3. Iniciar trabajo en la rama de funcionalidad
4. Programar revisión de código intermedia
5. Preparar release para incluir esta mejora

---
*Plan creado por el agente ARQUITECTO siguiendo las directrices de documentación-only. Todos los cambios de código deben ser implementados por el equipo de desarrollo siguiendo este plan.*