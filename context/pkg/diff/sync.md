diff sera el motor de sincronizacion que tiene como finalidad aplicar las reglas.

## Estado de implementacion

La conversion de formato esta implementada (Sprints 1-6). El motor usa `sourceExt`/`targetExt` en `MappingRule` y el interprete aplica la conversion al calcular las rutas destino. Las reglas YAML pueden indicar `source_ext`/`target_ext` en cada mapping.

## Requisitos del motor

- **Cambio de formato de archivos:** El motor debe poder cambiar el formato de los archivos durante la sincronizacion (ej. `.mdc` → `.md`, o viceversa, segun el agente origen/destino).
- **Reglas de conversion:** Las reglas (YAML) deben poder indicar explicitamente que cambio de formato aplicar en cada mapping (extension origen → extension destino, o transformacion de contenido).

## Submodulos

1. **Interprete:** Convierte las reglas en acciones; debe tener en cuenta las indicaciones de cambio de formato.
2. **Interaccion con archivos:** Wrapper del modulo fs de bun, sera usado por el interprete y permitira leer, editar, borrar y crear archivos y directorios.
