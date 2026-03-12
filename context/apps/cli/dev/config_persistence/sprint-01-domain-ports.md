# Sprint 1 — Domain Ports & Value Objects

## Context

Este sprint define el **contrato puro del dominio** del módulo Config & Persistence. No tiene dependencias de ningún otro módulo excepto Logger (ya completo). Es la base sobre la que todos los demás sprints construyen.

Según la arquitectura Hexagonal/Slice, el `Domain` no puede importar nada de `Infrastructure` ni `Application`. Solo define **qué** hace el módulo, no **cómo**.

---

## Dependencies

- **Depende de**: Logger & Debug (para logging interno de errores)
- **Bloqueador de**: Sprint 2, 4, 6 (TDD REDs necesitan los contratos del dominio)

---

## Pasos a Ejecutar

### 1. Crear la estructura del módulo

```
apps/cli/src/modules/config/
├── domain/
│   ├── project-path.vo.ts           ← Value Object: ruta del proyecto
│   ├── agent-id.vo.ts               ← Value Object: identificador de agente
│   ├── config-path.vo.ts            ← Value Object: ruta del archivo de config
│   ├── project-config.entity.ts     ← Entity: configuración del proyecto
│   ├── cli-preferences.entity.ts    ← Entity: preferencias del CLI
│   ├── config-repository.port.ts    ← Interface: IConfigRepository
│   └── preferences-repository.port.ts ← Interface: IPreferencesRepository
├── application/                     ← (vacío por ahora, para uso futuro)
├── infrastructure/                  ← (implementaciones — sprints posteriores)
└── index.ts                         ← barrel export del módulo
```

### 2. Definir `ProjectPath` Value Object

```typescript
// project-path.vo.ts
/** Representa la ruta absoluta al directorio del proyecto */
export type ProjectPath = string & { readonly __brand: unique symbol };

/** Factory para crear un ProjectPath validado */
export function createProjectPath(path: string): ProjectPath {
  if (!path || path.trim() === '') {
    throw new Error('Project path cannot be empty');
  }
  return path as ProjectPath;
}
```

### 3. Definir `AgentId` Value Object

```typescript
// agent-id.vo.ts
/** Identificador único de un agente (e.g., 'cursor', 'claude', 'copilot') */
export type AgentId = string & { readonly __brand: unique symbol };

/** Factory para crear un AgentId validado */
export function createAgentId(id: string): AgentId {
  if (!id || id.trim() === '') {
    throw new Error('Agent ID cannot be empty');
  }
  return id.toLowerCase().trim() as AgentId;
}
```

### 4. Definir `ConfigPath` Value Object

```typescript
// config-path.vo.ts
/** Ruta al archivo de configuración del proyecto */
export type ConfigPath = string & { readonly __brand: unique symbol };

/** Factory para crear un ConfigPath */
export function createConfigPath(path: string): ConfigPath {
  if (!path || path.trim() === '') {
    throw new Error('Config path cannot be empty');
  }
  return path as ConfigPath;
}
```

### 5. Definir `ProjectConfig` Entity

```typescript
// project-config.entity.ts
import type { AgentId } from './agent-id.vo';
import type { ProjectPath } from './project-path.vo';

/** Configuración del proyecto cargada desde .agents/config.yaml */
export interface ProjectConfig {
  /** Ruta al directorio del proyecto */
  readonly projectPath: ProjectPath;
  /** Agente activo para este proyecto */
  readonly activeAgent: AgentId;
  /** Lista de agentes configurados en el proyecto */
  readonly agents: readonly AgentId[];
  /** Timestamp de última modificación */
  readonly lastModified?: Date;
}

/** Props para crear una nueva configuración */
export interface CreateProjectConfigProps {
  projectPath: ProjectPath;
  activeAgent: AgentId;
  agents?: AgentId[];
  lastModified?: Date;
}

/** Factory para crear una ProjectConfig */
export function createProjectConfig(props: CreateProjectConfigProps): ProjectConfig {
  return {
    projectPath: props.projectPath,
    activeAgent: props.activeAgent,
    agents: props.agents ?? [props.activeAgent],
    lastModified: props.lastModified ?? new Date(),
  };
}
```

### 6. Definir `CliPreferences` Entity

```typescript
// cli-preferences.entity.ts
import type { AgentId } from './agent-id.vo';

/** Preferencias globales del CLI almacenadas en ~/.dotagents/preferences.json */
export interface CliPreferences {
  /** Agente activo por defecto (si no hay config de proyecto) */
  readonly defaultAgent?: AgentId;
  /** Habilitar modo verbose/debug */
  readonly verbose: boolean;
  /** Ruta al archivo de log del daemon */
  readonly daemonLogPath?: string;
}

/** Props para crear preferencias */
export interface CreateCliPreferencesProps {
  defaultAgent?: AgentId;
  verbose?: boolean;
  daemonLogPath?: string;
}

/** Factory para crear CliPreferences */
export function createCliPreferences(props: CreateCliPreferencesProps = {}): CliPreferences {
  return {
    defaultAgent: props.defaultAgent,
    verbose: props.verbose ?? false,
    daemonLogPath: props.daemonLogPath,
  };
}
```

### 7. Definir `IConfigRepository` Port

```typescript
// config-repository.port.ts
import type { ProjectConfig } from './project-config.entity';
import type { ConfigPath } from './config-path.vo';

/** Puerto de salida: contrato del repositorio de configuración del proyecto */
export interface IConfigRepository {
  /** Carga la configuración desde un archivo */
  load(path: ConfigPath): Promise<ProjectConfig>;
  /** Guarda la configuración en un archivo */
  save(config: ProjectConfig, path: ConfigPath): Promise<void>;
  /** Verifica si existe un archivo de configuración */
  exists(path: ConfigPath): Promise<boolean>;
}
```

### 8. Definir `IPreferencesRepository` Port

```typescript
// preferences-repository.port.ts
import type { CliPreferences } from './cli-preferences.entity';

/** Puerto de salida: contrato del repositorio de preferencias del CLI */
export interface IPreferencesRepository {
  /** Carga las preferencias globales */
  load(): Promise<CliPreferences>;
  /** Guarda las preferencias globales */
  save(preferences: CliPreferences): Promise<void>;
  /** Verifica si existe el archivo de preferencias */
  exists(): Promise<boolean>;
}
```

### 9. Crear barrel export inicial

```typescript
// index.ts del módulo
// Value Objects
export { createProjectPath } from './domain/project-path.vo';
export type { ProjectPath } from './domain/project-path.vo';

export { createAgentId } from './domain/agent-id.vo';
export type { AgentId } from './domain/agent-id.vo';

export { createConfigPath } from './domain/config-path.vo';
export type { ConfigPath } from './domain/config-path.vo';

// Entities
export { createProjectConfig } from './domain/project-config.entity';
export type { ProjectConfig, CreateProjectConfigProps } from './domain/project-config.entity';

export { createCliPreferences } from './domain/cli-preferences.entity';
export type { CliPreferences, CreateCliPreferencesProps } from './domain/cli-preferences.entity';

// Ports
export type { IConfigRepository } from './domain/config-repository.port';
export type { IPreferencesRepository } from './domain/preferences-repository.port';
```

---

## Status

- [x] Estructura de carpetas creada
- [x] `project-path.vo.ts` implementado
- [x] `agent-id.vo.ts` implementado
- [x] `config-path.vo.ts` implementado
- [x] `project-config.entity.ts` implementado
- [x] `cli-preferences.entity.ts` implementado
- [x] `config-repository.port.ts` implementado
- [x] `preferences-repository.port.ts` implementado
- [x] Barrel export creado
- [x] Revisión de JsDoc en todos los artefactos

---

## Resultado

### Archivos creados

| Archivo | Tipo |
|---------|------|
| `domain/project-path.vo.ts` | Value Object |
| `domain/agent-id.vo.ts` | Value Object |
| `domain/config-path.vo.ts` | Value Object |
| `domain/project-config.entity.ts` | Entity |
| `domain/cli-preferences.entity.ts` | Entity |
| `domain/config-repository.port.ts` | Port (Interface) |
| `domain/preferences-repository.port.ts` | Port (Interface) |
| `index.ts` | Barrel Export |

### Estructura final

```
apps/cli/src/modules/config/
├── domain/
│   ├── project-path.vo.ts
│   ├── agent-id.vo.ts
│   ├── config-path.vo.ts
│   ├── project-config.entity.ts
│   ├── cli-preferences.entity.ts
│   ├── config-repository.port.ts
│   └── preferences-repository.port.ts
├── application/         (vacío, para sprints posteriores)
├── infrastructure/      (vacío, para sprints posteriores)
├── __tests__/           (vacío, para sprints posteriores)
└── index.ts
```

**Fecha**: 2026-03-08
