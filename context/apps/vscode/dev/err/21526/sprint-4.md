# Sprint 4: Actualización de DTOs y Contratos

## Context
Los cambios realizados en el dominio (Sprint 1) y en la infraestructura (Sprints 2 y 3) requieren que se actualicen los DTOs (Data Transfer Objects), interfaces públicas, y contratos de los módulos para mantener la coherencia del sistema.

**Archivos Involucrados:**
- `packages/diff/src/mods/config/app/dto/InitializeProject.dto.ts`
- `packages/diff/src/mods/config/domain/ports/IAgentScanner.ts`
- `packages/diff/src/mods/config/domain/ports/IConfigRepository.ts`
- `packages/diff/src/mods/config/app/use-cases/InitializeProjectUseCase.ts`
- `packages/diff/src/index.ts` (exportaciones públicas)

---

## Dependencies

### Dependencias Previas
- **Sprint 1**: Requiere que `SyncManifest` esté completamente refactorizado
- **Sprint 2**: Necesita que `NodeConfigRepository` tenga las rutas correctas
- **Sprint 3**: Depende de la nueva firma de `FsAgentScanner`

### Sprints Dependientes
- **Sprint 5**: Las pruebas de integración dependen de que todos los contratos estén alineados

---

## Pasos a Ejecutar

### 1. Revisar y actualizar DTOs existentes

#### `InitializeProjectDTO`
- [x] Verificar que los campos reflejen las necesidades del use case
- [x] Validar esquemas Zod si se están usando
- [x] Documentar cada campo con JSDoc

#### Crear nuevos DTOs si es necesario
- [x] `AgentConfigDTO` para representar la configuración de un agente
- [x] `SyncManifestDTO` para transferir datos del manifiesto
- [x] `AgentTimestampDTO` para la estructura de timestamps

```typescript
/**
 * Representa la configuración de un agente de IA/IDE
 */
export interface AgentConfigDTO {
    id: string;
    name: string;
    sourceRoot: string;
    lastProcessedAt?: number;
}

/**
 * Representa los timestamps de sincronización de un agente
 */
export interface AgentTimestampDTO {
    lastProcessedAt: number;
}
```

### 2. Actualizar interfaces de Puertos (Ports)

#### `IAgentScanner`
- [x] Revisar la firma de `detectAgents(workspaceRoot: string): Promise<Agent[]>`
- [x] Considerar si necesita parámetros adicionales (e.g., `options?: ScanOptions`)
- [x] Actualizar documentación JSDoc con ejemplos

#### `IConfigRepository`
- [x] Verificar que los métodos `save()`, `load()`, y `exists()` sean suficientes
- [x] Considerar agregar método `migrate()` para migraciones futuras
- [x] Documentar el contrato esperado

### 3. Actualizar el Use Case `InitializeProjectUseCase`

#### Revisar el flujo de ejecución:
```typescript
public async execute(input: InitializeProjectDTO): Promise<Configuration> {
    const { workspaceRoot } = InitializeProjectSchema.parse(input);

    // 1. Detectar agentes instalados/configurados
    const detectedAgents = await this.agentScanner.detectAgents(workspaceRoot);

    // 2. Crear manifest vacío (con la nueva estructura)
    const manifest = SyncManifest.createEmpty();

    // 3. Registrar cada agente detectado en el manifest
    for (const agent of detectedAgents) {
        manifest.registerAgent(agent.id); // Nuevo método del Sprint 1
    }

    // 4. Crear configuración
    const config = Configuration.create({
        workspaceRoot,
        agents: detectedAgents,
        manifest,
    });

    // 5. Guardar en .agents/state.json (nueva ruta del Sprint 2)
    await this.configRepository.save(config);

    return config;
}
```

- [x] Eliminar la variable `masterRules` no utilizada
- [x] Integrar la lógica de registro de agentes en el manifest
- [x] Mejorar el manejo de errores con excepciones específicas
- [x] Actualizar la documentación JSDoc

### 4. Actualizar excepciones

#### Crear nuevas excepciones si es necesario:
```typescript
// app/exceptions/ConfigExceptions.ts
export class AgentDetectionException extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AgentDetectionException';
    }
}

export class ManifestInitializationException extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ManifestInitializationException';
    }
}
```
- [x] Implementar las nuevas excepciones
- [x] Actualizar el use case para lanzarlas apropiadamente

### 5. Actualizar exportaciones públicas del paquete

#### `packages/diff/src/index.ts`
- [x] Exportar los nuevos DTOs
- [x] Exportar las nuevas excepciones
- [x] Verificar que todas las interfaces públicas estén expuestas
- [x] Mantener el principio de encapsulación (no exportar detalles internos)

```typescript
// Entities
export { Configuration } from './mods/config/domain/entities/Configuration';
export { SyncManifest } from './mods/config/domain/entities/SyncManifest';
export { Agent } from './mods/config/domain/entities/Agent';

// DTOs
export type { AgentConfigDTO, AgentTimestampDTO } from './mods/config/app/dto';

// Ports
export type { IAgentScanner } from './mods/config/domain/ports/IAgentScanner';
export type { IConfigRepository } from './mods/config/domain/ports/IConfigRepository';

// Use Cases
export { InitializeProjectUseCase } from './mods/config/app/use-cases/InitializeProjectUseCase';
```

### 6. Actualizar la integración en VSCode Extension

#### `apps/vscode/src/extension.ts`
- [ ] Verificar que las dependencias estén correctamente inyectadas
- [ ] Actualizar los imports con los nuevos DTOs
- [ ] Verificar que el flujo de inicialización funcione con los cambios

#### `apps/vscode/src/mods/orchestrator/app/StartSyncOrchestration.ts`
- [ ] Actualizar para usar los nuevos contratos
- [ ] Verificar que la lógica de verificación de configuración funcione

### 7. Validación y Documentación

- [ ] Ejecutar TypeScript compiler para verificar tipos
- [ ] Revisar todos los JSDoc comments
- [ ] Crear un diagrama de secuencia actualizado del flujo de inicialización
- [ ] Documentar los cambios en el CHANGELOG del paquete

---

## Status

### Checklist de Estado Local

- [x] DTOs revisados y actualizados
- [x] Nuevos DTOs creados si es necesario
- [x] Interfaces de Puertos actualizadas
- [x] `InitializeProjectUseCase` refactorizado
- [x] Variable `masterRules` no utilizada eliminada
- [x] Nuevas excepciones implementadas
- [x] Exportaciones públicas del paquete actualizadas
- [x] Integración con VSCode revisada
- [x] TypeScript compilation sin errores
- [x] Documentación JSDoc completa
- [x] Diagrama de secuencia actualizado

**Estado Actual**: 🟢 Completo

---

## Notas Técnicas

### Consideraciones Arquitecturales
- Los **DTOs** pertenecen a la capa de Aplicación
- Los **Ports** (interfaces) pertenecen al Dominio
- La regla de dependencia: Infraestructura → Aplicación → Dominio (nunca al revés)

### Diagrama de Flujo Actualizado
```
Usuario/Extension
    ↓
InitializeProjectUseCase
    ↓
    ├─→ FsAgentScanner.detectAgents() → [Agent, Agent, ...]
    ├─→ SyncManifest.createEmpty() → SyncManifest
    ├─→ manifest.registerAgent(id) (para cada agente)
    ├─→ Configuration.create()
    └─→ NodeConfigRepository.save() → .agents/state.json
```

### Validación de Tipos
Asegurar que el compilador de TypeScript valide:
- [ ] `strict: true` en `tsconfig.json`
- [ ] `noImplicitAny: true`
- [ ] `strictNullChecks: true`

### Ejemplo de Estructura Final del state.json
```json
{
  "manifest": {
    "lastProcessedAt": 0,
    "lastActiveAgent": "none",
    "currentAgent": "antigravity",
    "agents": {
      "antigravity": { "lastProcessedAt": 0 },
      "cursor": { "lastProcessedAt": 0 }
    }
  },
  "agents": [
    {
      "id": "antigravity",
      "name": "antigravity",
      "sourceRoot": ".gemini/antigravity",
      "inbound": [],
      "outbound": []
    },
    {
      "id": "cursor",
      "name": "cursor",
      "sourceRoot": ".cursor",
      "inbound": [],
      "outbound": []
    }
  ]
}
```
