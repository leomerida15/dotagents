el state.json tiene varios errores que estan en el core del paquete como concepto


1. en agents no van lo paqutes del proyeto ,


{

"manifest": {

"lastProcessedAt": 0,

"lastActiveAgent": "none",

"agents": {

"agents": 0

    }

  },

"agents": [

    {

"id": "cli",

"name": "cli",

"sourceRoot": "apps/cli",

"inbound": [],

"outbound": []

    },

    {

"id": "diff",

"name": "diff",

"sourceRoot": "packages/diff",

"inbound": [],

"outbound": []

    },

    {

"id": "querybuild",

"name": "querybuild",

"sourceRoot": "packages/querybuild",

"inbound": [],

"outbound": []

    },

    {

"id": "react",

"name": "react",

"sourceRoot": "packages/react",

"inbound": [],

"outbound": []

    }

  ]

}

por algun motico en agents agregaste los diferentes repos que contengan package.json.

lal funcion de agents en contener una seudo DB local con relacion clave valor que contendra nombre del IDE y timetamp




{

"manifest": {

"lastProcessedAt": 0,

"lastActiveAgent": "none",

"currentAgent": "antigravity",

"agents": {

"antigravity": {

"lastProcessedAt": 0

    }

    }

    }

}



2. creo los archivos de configuracion del agente dentro del .ai debio crearlo dentro de **.agents**

---

# Análisis Técnico y Propuestas (#21526)

## 1. Comportamiento Esperado

### Ubicación de Archivos
- La carpeta raíz de configuración y puente universal debe ser `.agents/`.
- El archivo de estado (`state.json`) y las carpetas de recursos (`rules`, `skills`, `mcp`) deben residir **directamente** bajo `.agents/`, no dentro de una subcarpeta redundante `.agents/.ai/`.

### Definición de "Agents"
- Los **Agentes** en el contexto de `state.json` deben representar las herramientas de IA o IDEs (ej. `antigravity`, `cursor`, `claude-code`, `cline`) que interactúan con el proyecto.
- **No deben incluirse** los paquetes o aplicaciones del propio proyecto (ej. `apps/cli`, `packages/diff`) como si fueran agentes.

### Estructura del `state.json`
- El campo `agents` debe funcionar como una base de datos clave-valor integrada en el manifiesto, donde cada clave es el nombre del IDE/Agente y el valor contiene metadatos de sincronización (como `lastProcessedAt`).
- Ejemplo de estructura correcta:
    ```json
    {
      "manifest": {
        "lastProcessedAt": 0,
        "lastActiveAgent": "none",
        "currentAgent": "antigravity",
        "agents": {
          "antigravity": { "lastProcessedAt": 0 }
        }
      }
    }
    ```

## 2. Posibles Causas

### Escaneo Incorrecto en `FsAgentScanner`
El componente `FsAgentScanner.ts` está diseñado actualmente para iterar sobre las carpetas `apps/` y `packages/` del monorepo, tratando cada subdirectorio como un agente independiente.
- **Razón**: Hubo una confusión conceptual entre "componentes del proyecto a sincronizar" y "agentes que realizan la sincronización".

### Rutas Hardcoded en `NodeConfigRepository`
En `NodeConfigRepository.ts`, el método `save` tiene explícitamente definida la creación de una carpeta `.ai` dentro de `.agents`:
- `const aiPath = join(agentsPath, '.ai');`
- Esto provoca que toda la configuración se entierre en un nivel adicional no deseado.

### Lógica Inicial en el Dominio (`SyncManifest`)
La entidad de dominio `SyncManifest.ts` tiene un método `createEmpty` que inicializa el objeto `agents` con un valor genérico `agents: 0`.
- **Código detectado**: `agents: { agents: 0 }` en `SyncManifest.createEmpty()`.

## 3. Análisis Arquitectónico
El problema reside en una desviación de los **Estándares de Arquitectura (Hexagonal + Vertical Slices)**:
- **Infraestructura**: Los adaptadores no están alineados con el objetivo del "Universal Bridge" (.agents).
- **Dominio**: La entidad `SyncManifest` no refleja correctamente la relación clave-valor esperada.

## 4. Propuesta de Mejora (Sprint Sugerido)
1. **Refactorizar `FsAgentScanner`**: Eliminar el escaneo de carpetas locales y permitir que los agentes se definan mediante configuración o descubrimiento.
2. **Corregir `NodeConfigRepository`**: Eliminar la referencia a `.ai` y guardar directamente en `.agents/`.
3. **Actualizar `SyncManifest`**: Ajustar el esquema para que soporte el mapeo de agentes dinámicos.
