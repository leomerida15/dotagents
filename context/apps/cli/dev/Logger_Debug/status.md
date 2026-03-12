# Logger & Debug Module — Sprint Plan Status

> **Módulo**: Logger & Debug (Orden #1 en el Build Order del CLI)
> **Estrategia**: TDD (RED → GREEN → REFACTOR) con Bun Test
> **Arquitectura**: Hexagonal / Slice — Sin dependencias externas de módulos

---

## Tabla de Sprints

| # | Nombre                                             | Descripción                                                                                                                                                                                   | Status       |
| - | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 1 | **Domain Ports & Value Objects**             | Define las interfaces (ports) y value objects del dominio logger:`LogLevel`, `LogEntry`, `ILogger`, `IErrorFormatter`. Sin dependencias externas. Base contractual de todo el módulo. | ✅ Hecho      |
| 2 | **TDD RED — CliLogger**                     | Escribe las pruebas de comportamiento de `CliLogger` (FAIL esperado). Cubre: salida color-coded por nivel, umbrales configurables, serialización de objetos grandes.                        | ✅ Hecho     |
| 3 | **GREEN — CliLogger Implementation**        | Implementa `CliLogger` (adapter de consola con ANSI) hasta que pase todos los tests del Sprint 2. Sin modificar los tests.                                                                   | ✅ Hecho    |
| 4 | **TDD RED — DaemonFileLogger**              | Escribe las pruebas de `DaemonFileLogger`. Cubre: append con timestamp, recreación del directorio, manejo de errores de disco.                                                              | ✅ Hecho    |
| 5 | **GREEN — DaemonFileLogger Implementation** | Implementa `DaemonFileLogger` usando `Bun.file().writer()` hasta que pase todos los tests del Sprint 4.                                                                                    | ✅ Hecho    |
| 6 | **TDD RED — ErrorFormatter**                | Escribe las pruebas de `ErrorFormatter`. Cubre: formateo de Error con causa, strings como errores, referencias circulares.                                                                   | ✅ Hecho    |
| 7 | **GREEN — ErrorFormatter Implementation**   | Implementa `PrettyErrorFormatter` hasta que pase todos los tests del Sprint 6.                                                                                                               | ✅ Hecho    |
| 8 | **Module Integration & Barrel Export**       | Crea `logger.module.ts` con el barrel export del módulo. Integra `CliLogger` + `DaemonFileLogger` + `ErrorFormatter`. Tests de integración.                                          | ✅ Hecho    |
| 9 | **REFACTOR & Clean Code Review**             | Revisión de código, eliminación de duplicación, aplicación de naming conventions, JsDoc completo en todos los artefactos.                                                                 | ✅ Hecho    |
