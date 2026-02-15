# Sprint 3: Infrastructure Implementation

## Context
Implementar la persistencia de lectura. A diferencia del `getter` que escribe, este módulo solo necesita leer y parsear los YAMLs existentes.

## Dependencies
- **Previous**: Sprint 2 (Application Definition)
- **Next**: Sprint 4 (Integration)

## Steps to Execute

### 1. `BunInstalledRuleRepository`
- Lee recurrentemente el directorio `.agents/.ai`.
- Usa `YamlMapper` (posiblemente movido a `shared` o duplicado/adaptado) para convertir a Entidad.

### 2. Manejo de Errores
- Qué pasa si el archivo está corrupto o incompleto.

## Status Checklist
- [x] `BunInstalledRuleRepository` implementado.
- [x] Tests de lectura con archivos mock.
