# Sprint 6 — TDD RED: ErrorFormatter

## Context

Fase RED del TDD para `ErrorFormatter` / `PrettyErrorFormatter`. Estandariza la presentación de errores en todo el CLI para asegurar una experiencia de diagnóstico consistente.

---

## Dependencies

- **Depende de**: Sprint 1 (`IErrorFormatter` port)
- **Bloqueador de**: Sprint 7 (implementación)

---

## Pasos a Ejecutar

### 1. Crear archivo de test

**Ruta**: `apps/cli/src/modules/logger/__tests__/error-formatter.test.ts`

### 2. Behavior Contract — Tests a escribir

#### Happy Path
- [ ] `formatter.format(new Error("fail"))` → string que incluye el mensaje del error
- [ ] Error con `cause` property → incluye la causa en la salida (jerarquía)
- [ ] `formatter.format(new Error(""))` → maneja mensaje vacío sin crashear

#### Edge Cases
- [ ] Pasar un `string` como argumento → lo formatea como si fuera un error (compatibilidad)
- [ ] Error con stack trace → opcionalmente incluye el stack en modo DEBUG
- [ ] Error sin stack (e.g., `Error` con `captureStackTrace` deshabilitado) → funciona igualmente

#### Negative Path
- [ ] Objeto con referencia circular en sus propiedades → no lanza excepción
- [ ] Pasar `null` → retorna string descriptivo sin crashear
- [ ] Pasar `undefined` → retorna string descriptivo sin crashear

### 3. Estructura del test

```typescript
import { describe, it, expect } from 'bun:test';
import { PrettyErrorFormatter } from '../infrastructure/pretty-error-formatter';

describe('PrettyErrorFormatter', () => {
  const formatter = new PrettyErrorFormatter();

  describe('format(Error)', () => {
    it('should include the error message in the output', () => {
      const result = formatter.format(new Error('something failed'));
      expect(result).toContain('something failed');
    });

    it('should include nested cause when present', () => {
      const cause  = new Error('root cause');
      const error  = new Error('wrapper', { cause });
      const result = formatter.format(error);
      expect(result).toContain('root cause');
    });
  });

  describe('format(string)', () => {
    it('should format a plain string as an error message', () => {
      const result = formatter.format('plain string error');
      expect(result).toContain('plain string error');
    });
  });

  describe('edge cases', () => {
    it('should handle null without throwing', () => {
      expect(() => formatter.format(null)).not.toThrow();
    });

    it('should handle circular references without throwing', () => {
      const obj: Record<string, unknown> = {};
      obj['self'] = obj;
      expect(() => formatter.format(obj)).not.toThrow();
    });
  });
});
```

### 4. Verificar RED State

```bash
cd apps/cli && bun test src/modules/logger/__tests__/error-formatter.test.ts
```

**Resultado esperado**: FAIL — `Cannot find module '../infrastructure/pretty-error-formatter'`

---

## Status

- [x] Archivo de test creado
- [x] Tests Happy Path escritos
- [x] Tests Edge Cases escritos
- [x] Tests Negative Path escritos
- [x] RED verificado
- [x] Handoff documentado para Sprint 7

---

## Resultado

- **Archivo**: `apps/cli/src/modules/logger/__tests__/error-formatter.test.ts`
- **Tests**: 9 total (3 Happy Path, 3 Edge Cases, 3 Negative Path)
- **Error esperado**: `Cannot find module '../infrastructure/pretty-error-formatter'`
- **Fecha**: 2026-03-08
