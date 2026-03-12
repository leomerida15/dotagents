# Sprint 8 — Module Integration & Barrel Export

## Context

Une los tres componentes (`CliLogger`, `DaemonFileLogger`, `PrettyErrorFormatter`) en un módulo cohesivo con un barrel export limpio. Añade tests de integración que validan que el módulo funciona correctamente como unidad.

---

## Dependencies

- **Depende de**: Sprints 3, 5, 7 (todos los componentes GREEN)
- **Bloqueador de**: Los módulos futuros (Config, Agent Bridge, Orchestrator, TUI, Daemon) que importan del logger

---

## Pasos a Ejecutar

### 1. Crear barrel export del módulo

**Ruta**: `apps/cli/src/modules/logger/index.ts`

```typescript
// Domain — contratos públicos
export { LogLevel } from './domain/log-level.vo';
export type { LogEntry } from './domain/log-entry.vo';
export type { ILogger } from './domain/logger.port';
export type { IErrorFormatter } from './domain/error-formatter.port';

// Infrastructure — implementaciones listas para usar
export { CliLogger } from './infrastructure/bun-console-logger';
export { DaemonFileLogger } from './infrastructure/bun-file-logger';
export { PrettyErrorFormatter } from './infrastructure/pretty-error-formatter';
```

### 2. Crear `logger.module.ts` — Factory opcional

**Ruta**: `apps/cli/src/modules/logger/logger.module.ts`

```typescript
import { CliLogger } from './infrastructure/bun-console-logger';
import { DaemonFileLogger } from './infrastructure/bun-file-logger';
import { PrettyErrorFormatter } from './infrastructure/pretty-error-formatter';
import { LogLevel } from './domain/log-level.vo';

interface LoggerModuleConfig {
  level?:       LogLevel;
  logFilePath?: string;
}

/**
 * Factory del módulo Logger.
 * Retorna instancias configuradas listas para inyección.
 */
export function createLoggerModule({ level = LogLevel.INFO, logFilePath }: LoggerModuleConfig = {}) {
  const consoleLogger = new CliLogger({ level });
  const errorFormatter = new PrettyErrorFormatter();
  const fileLogger = logFilePath
    ? new DaemonFileLogger({ filePath: logFilePath, level })
    : null;

  return { consoleLogger, fileLogger, errorFormatter };
}
```

### 3. Crear tests de integración

**Ruta**: `apps/cli/src/modules/logger/__tests__/logger.module.test.ts`

- [ ] `createLoggerModule()` retorna instancias válidas con sus interfaces correctas
- [ ] `consoleLogger` implementa `ILogger`
- [ ] `errorFormatter` implementa `IErrorFormatter`
- [ ] `fileLogger` es `null` si no se pasa `logFilePath`
- [ ] Importaciones desde index.ts del módulo funcionan correctamente

### 4. Ejecutar suite completa

```bash
cd apps/cli && bun test src/modules/logger/
```

**Resultado esperado**: Todos los tests pasan.

---

## Status

- [x] Barrel export `index.ts` creado
- [x] `logger.module.ts` factory creado
- [x] Tests de integración escritos y pasando (12 tests)
- [x] Suite completa del módulo sin fallos (38 tests)
- [x] Módulo importable desde fuera con `import { CliLogger } from '@/modules/logger'`

---

## Resultado

### Archivos creados/modificados
- `index.ts` — barrel export actualizado con infrastructure exports
- `logger.module.ts` — factory function `createLoggerModule()`
- `__tests__/logger.module.test.ts` — 12 tests de integración

### Test Summary
- **CliLogger**: 9 tests
- **DaemonFileLogger**: 8 tests
- **ErrorFormatter**: 9 tests
- **Module Integration**: 12 tests
- **Total**: 38 tests, 79 expect() calls

### Notas
- Los nombres de archivos usados son `cli-logger.ts` y `daemon-file-logger.ts` (no los del sprint original)
- El módulo está listo para ser importado desde otros módulos del CLI

**Fecha**: 2026-03-08
