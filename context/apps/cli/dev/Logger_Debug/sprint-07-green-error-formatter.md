# Sprint 7 — GREEN: ErrorFormatter Implementation

## Context

Implementa `PrettyErrorFormatter` para que pase los tests del Sprint 6. El formatter debe manejar múltiples tipos de input de forma robusta y producir salida legible.

---

## Dependencies

- **Depende de**: Sprint 6 (tests RED verificados)
- **Bloqueador de**: Sprint 8 (integración)

---

## Pasos a Ejecutar

### 1. Crear el adapter

**Ruta**: `apps/cli/src/modules/logger/infrastructure/pretty-error-formatter.ts`

```typescript
import type { IErrorFormatter } from '../domain/error-formatter.port';

/**
 * PrettyErrorFormatter — Formatea errores de forma legible y estandarizada.
 * Maneja Error nativo, strings, nulls y referencias circulares.
 */
export class PrettyErrorFormatter implements IErrorFormatter {
  /**
   * Formatea cualquier tipo de valor como un string de error legible.
   * @param error - El valor a formatear (Error, string, object, null, etc.)
   */
  format(error: unknown): string {
    if (error === null || error === undefined) {
      return `[Error] (empty — null or undefined received)`;
    }

    if (typeof error === 'string') {
      return `[Error] ${error}`;
    }

    if (error instanceof Error) {
      return this.formatError(error);
    }

    return `[Error] ${this.safeSerialize(error)}`;
  }

  private formatError(error: Error, depth = 0): string {
    const indent  = '  '.repeat(depth);
    const message = `${indent}[Error] ${error.message}`;
    const lines   = [message];

    if (error.cause instanceof Error) {
      lines.push(`${indent}  Caused by:`);
      lines.push(this.formatError(error.cause, depth + 2));
    } else if (error.cause !== undefined) {
      lines.push(`${indent}  Cause: ${this.safeSerialize(error.cause)}`);
    }

    return lines.join('\n');
  }

  /** Serialización segura que no lanza excepción con referencias circulares */
  private safeSerialize(value: unknown): string {
    const seen = new WeakSet();
    try {
      return JSON.stringify(value, (_key, val) => {
        if (typeof val === 'object' && val !== null) {
          if (seen.has(val)) return '[Circular]';
          seen.add(val);
        }
        return val;
      });
    } catch {
      return String(value);
    }
  }
}
```

### 2. Ejecutar tests para verificar GREEN

```bash
cd apps/cli && bun test src/modules/logger/__tests__/error-formatter.test.ts
```

### 3. Verificar sin regresiones

```bash
cd apps/cli && bun test
```

---

## Status

- [x] `pretty-error-formatter.ts` creado
- [x] Tests del Sprint 6 pasan (GREEN) — 9/9 tests
- [x] No hay regresiones — 26/26 tests pasan
- [x] JsDoc completo

---

## Resultado

- **Archivo**: `apps/cli/src/modules/logger/infrastructure/pretty-error-formatter.ts`
- **Tests**: 9 pass, 0 fail, 11 expect() calls
- **Total módulo logger**: 26 tests (9 CliLogger + 8 DaemonFileLogger + 9 ErrorFormatter)
- **Fecha**: 2026-03-08
