# @dotagents/rule

Este paquete es el motor encargado de gestionar las reglas de sincronización que utiliza el paquete `@dotagents/diff`. Su función es actuar como puente entre las definiciones de agentes (YAML) y el motor de ejecución.

## Estructura de Módulos (Vertical Slices)

El paquete se divide en dos módulos principales ubicados en `src/mods/`, cada uno siguiendo una arquitectura hexagonal (Domain, Application, Infrastructure):

### 1. Módulo `getter`
Responsable de la obtención y sincronización de reglas desde fuentes externas.
- **Propósito**: Buscar, validar y descargar archivos de reglas.
- **Fuentes**: Soporta repositorio público de GitHub y sistema de archivos local.
- **Detección**: Identifica la fuente mediante variables de entorno durante el build/runtime.

### 2. Módulo `client`
Responsable de ofrecer una interfaz de alto nivel para consumir las reglas persistidas.
- **Propósito**: Interactuar con el directorio `.agents/.ai/` del proyecto.
- **Persistencia**: Maneja la lectura de las reglas clonadas localmente.
- **Interfaz**: Expone métodos para que otros paquetes (como `diff`) consulten los mapeos de agentes específicos.

## Estrategia de Sincronización

1. **Localización**: Se definen los entornos (agentes) que requieren sincronización.
2. **Obtención (`getter`)**: Se buscan las reglas en la fuente configurada (GitHub/Local).
3. **Clonación**: Se persisten las reglas en `.agents/.ai/`.
4. **Consumo (`client`)**: Se leen y parsean las reglas desde el directorio local para su uso en el motor de sincronización.
