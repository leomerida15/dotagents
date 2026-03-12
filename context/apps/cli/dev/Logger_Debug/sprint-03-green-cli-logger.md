# Sprint 3 — GREEN: CliLogger Implementation

## Context

Este sprint implementa `CliLogger` para que pase los tests del Sprint 2. **No se modifican los tests**. Implementación usando ANSI escape codes nativos de Node/Bun, sin dependencias externas.

---

## Dependencies

- **Depende de**: Sprint 2 (tests RED deben estar verificados antes de empezar)
- **Bloqueador de**: Sprint 8 (integración del módulo)

---

## Pasos a Ejecutar

### 1. Crear el adapter

**Ruta**: `apps/cli/src/modules/logger/infrastructure/bun-console-logger.ts`

```typescript
import type { ILogger } from '../domain/logger.port';
import { LogLevel } from '../domain/log-level.vo';

interface CliLoggerProps {
  level?: LogLevel;
}

/** Colores ANSI para cada nivel de log */
const LEVEL_COLORS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: '\x1b[90m',  // gris
  [LogLevel.INFO]:  '\x1b[36m',  // cian
  [LogLevel.WARN]:  '\x1b[33m',  // amarillo
  [LogLevel.ERROR]: '\x1b[31m',  // rojo
};

const RESET = '\x1b[0m';

/** Orden numérico para aplicar threshold */
const LEVEL_ORDER: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]:  1,
  [LogLevel.WARN]:  2,
  [LogLevel.ERROR]: 3,
};

/**
 * CliLogger — Adapter de consola con colores ANSI.
 * Implementa ILogger para el terminal CLI.
 */
export class CliLogger implements ILogger {
  private threshold: LogLevel;

  constructor({ level = LogLevel.DEBUG }: CliLoggerProps) {
    this.threshold = level;
  }

  setLevel(level: LogLevel): void {
    this.threshold = level;
  }

  debug(message: string, context?: unknown): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: unknown): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: unknown): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: unknown): void {
    this.log(LogLevel.ERROR, message, context);
  }

  private log(level: LogLevel, message: string, context?: unknown): void {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[this.threshold]) return;

    const color  = LEVEL_COLORS[level];
    const prefix = `${color}[${level}]${RESET}`;
    const parts  = [prefix, message];

    if (context !== undefined) {
      const serialized = this.serialize(context);
      parts.push(serialized);
    }

    console.log(...parts);
  }

  /** Serializa el contexto de forma segura evitando errores con objetos complejos */
  private serialize(context: unknown): string {
    try {
      return JSON.stringify(context);
    } catch {
      return String(context);
    }
  }
}
```

### 2. Ejecutar tests para verificar GREEN

```bash
cd apps/cli && bun test src/modules/logger/__tests__/cli-logger.test.ts
```

**Resultado esperado**: PASS — todos los tests del Sprint 2 pasan.

### 3. Verificar que no existen regresiones

```bash
cd apps/cli && bun test
```

---

## Status

- [x] `cli-logger.ts` creado (nota: se usó `cli-logger.ts` en lugar de `bun-console-logger.ts` para coincidir con el import del test)
- [x] Todos los tests del Sprint 2 pasan (GREEN) — 9/9 tests
- [x] No hay regresiones en tests existentes
- [x] JsDoc completo en la clase e interfaces

---

## Resultado

- **Archivo**: `apps/cli/src/modules/logger/infrastructure/cli-logger.ts`
- **Tests**: 9 pass, 0 fail, 23 expect() calls
- **Fecha**: 2026-03-08
