# Sprint 1 — Domain Ports & Value Objects

## Context

Este sprint define el **contrato puro del dominio** del módulo Logger & Debug. No tiene dependencias de ningún otro módulo del CLI. Es la base sobre la que todos los demás sprints (y módulos futuros) construyen.

Según la arquitectura Hexagonal/Slice, el `Domain` no puede importar nada de `Infrastructure` ni `Application`. Solo define **qué** hace el módulo, no **cómo**.

---

## Dependencies

- **Depende de**: *(Ninguno — es la base)*
- **Bloqueador de**: Sprint 2, 4, 6 (TDD REDs necesitan los contratos del dominio para escribir los tests contra las interfaces)

---

## Pasos a Ejecutar

### 1. Crear la estructura del módulo

```
apps/cli/src/modules/logger/
├── domain/
│   ├── log-level.vo.ts           ← Value Object: enum de niveles de log
│   ├── log-entry.vo.ts           ← Value Object: entrada de log con metadata
│   ├── logger.port.ts            ← Interface: ILogger (contrato del logger)
│   └── error-formatter.port.ts   ← Interface: IErrorFormatter
├── application/                  ← (vacío por ahora, para uso futuro)
├── infrastructure/               ← (implementaciones — sprints posteriores)
└── index.ts                      ← barrel export del módulo
```

### 2. Definir `LogLevel` Value Object

```typescript
// log-level.vo.ts
/** Enum de niveles de log disponibles en el sistema */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO  = 'INFO',
  WARN  = 'WARN',
  ERROR = 'ERROR',
}
```

### 3. Definir `LogEntry` Value Object

```typescript
// log-entry.vo.ts
import { LogLevel } from './log-level.vo';

/** Representa una entrada de log inmutable con metadatos */
export interface LogEntry {
  readonly level:     LogLevel;
  readonly message:   string;
  readonly timestamp: Date;
  readonly context?:  unknown;
}
```

### 4. Definir `ILogger` Port

```typescript
// logger.port.ts
import type { LogLevel } from './log-level.vo';

/** Puerto de salida: contrato del logger. Implementado por los adapters. */
export interface ILogger {
  debug(message: string, context?: unknown): void;
  info(message: string, context?: unknown): void;
  warn(message: string, context?: unknown): void;
  error(message: string, context?: unknown): void;
  setLevel(level: LogLevel): void;
}
```

### 5. Definir `IErrorFormatter` Port

```typescript
// error-formatter.port.ts
/** Puerto: contrato del formateador de errores */
export interface IErrorFormatter {
  format(error: unknown): string;
}
```

### 6. Crear barrel export inicial

```typescript
// index.ts del módulo
export * from './domain/log-level.vo';
export * from './domain/log-entry.vo';
export type { ILogger } from './domain/logger.port';
export type { IErrorFormatter } from './domain/error-formatter.port';
```

---

## Status

- [x] Estructura de carpetas creada
- [x] `log-level.vo.ts` implementado
- [x] `log-entry.vo.ts` implementado
- [x] `logger.port.ts` implementado
- [x] `error-formatter.port.ts` implementado
- [x] Barrel export creado
- [x] Revisión de JsDoc en todos los artefactos
