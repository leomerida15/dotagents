# Sprint 1: Refactorización de Dominio

## Context
La entidad `SyncManifest` en la capa de dominio tiene una inicialización incorrecta del esquema de agentes. El método `createEmpty()` genera una estructura `{ agents: { agents: 0 } }` que no refleja el diseño esperado de un registro clave-valor donde cada clave es el nombre de un IDE/Agente.

**Archivos Involucrados:**
- `packages/diff/src/modules/config/domain/entities/SyncManifest.ts`

---

## Dependencies

### Dependencias Previas
- Ninguna (Sprint inicial)

### Sprints Dependientes
- **Sprint 2**: Requiere que el dominio esté correctamente definido antes de actualizar el repositorio
- **Sprint 3**: Necesita el esquema correcto para saber qué estructura de agentes esperar
- **Sprint 4**: Los DTOs deben reflejar la nueva estructura de dominio

---

## Pasos a Ejecutar

### 1. Analizar la estructura actual de `SyncManifest`
- [x] Revisar la interfaz `SyncManifestProps`
- [x] Identificar todos los métodos que interactúan con el campo `agents`
- [x] Documentar el comportamiento actual vs. esperado

### 2. Redefinir el esquema de `agents`
- [x] Cambiar de `agents: Record<string, number>` a `agents: Record<string, AgentTimestamp>`
- [x] Crear interfaz `AgentTimestamp` con `{ lastProcessedAt: number }`
- [x] Actualizar la documentación JSDoc

### 3. Corregir el método `createEmpty()`
```typescript
// Antes:
agents: { agents: 0 }

// Después:
agents: {}
```
- [x] Implementar el cambio
- [x] Verificar que no rompa la lógica de `needsSync()` y `markAsSynced()`

### 4. Añadir el campo `currentAgent`
- [x] Extender `SyncManifestProps` con `currentAgent: string | null`
- [x] Actualizar el constructor y el método `toJSON()`
- [x] Añadir getter y setter apropiados

### 5. Actualizar métodos de manipulación
- [x] Revisar `markAsSynced()` para que guarde la estructura correcta
- [x] Revisar `needsSync()` para comparar timestamps correctamente
- [x] ~Añadir método `registerAgent(agentId: string)` si es necesario~ (Pospuesto para futuros sprints)

### 6. Escribir pruebas unitarias
- [x] Crear casos de prueba para `createEmpty()`
- [x] Verificar `markAsSynced()` con múltiples agentes
- [x] Validar `needsSync()` con diferentes escenarios de timestamps

---

## Status

### Checklist de Estado Local

- [x] Análisis de código existente completado
- [x] Interfaz `SyncManifestProps` actualizada
- [x] Método `createEmpty()` corregido
- [x] Campo `currentAgent` integrado
- [x] Métodos de manipulación actualizados
- [x] Pruebas unitarias escritas y pasando
- [x] Documentación JSDoc actualizada
- [x] Code review completado

**Estado Actual**: 🟢 Completo

---

## Notas Técnicas

### Consideraciones Arquitecturales
- Esta capa pertenece al **Dominio puro**, por lo que no debe tener dependencias externas
- Seguir el principio de **Single Responsibility**: SyncManifest solo debe conocer timestamps y estados, no rutas de archivos

### Ejemplo de Estructura Esperada
```json
{
  "lastProcessedAt": 1708053281000,
  "lastActiveAgent": "antigravity",
  "currentAgent": "antigravity",
  "agents": {
    "antigravity": { "lastProcessedAt": 1708053281000 },
    "cursor": { "lastProcessedAt": 1708053100000 }
  }
}
```
