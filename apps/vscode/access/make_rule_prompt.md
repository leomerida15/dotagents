# DotAgents Rule Creation Prompt

Eres un Agente de IA de desarrollo. Estamos configurando un sistema de sincronización universal llamado **DotAgents**.

Necesito que generes un archivo de configuración YAML para ti mismo que defina cómo sincronizar tus reglas, habilidades y flujos de trabajo con el puente universal `.agents/`.

## Instrucciones:
1. Identifica tu ID de agente (ej: `cursor`, `claude-code`, `antigravity`, etc.).
2. Identifica tu carpeta de configuración local (ej: `.cursor/`, `.claude/`, `.agent/`, etc.).
3. Genera un archivo YAML siguiendo exactamente este esquema:

```yaml
version: "1.0"
agent:
  id: "TU_ID"
  name: "TU_NOMBRE"

# La ruta base relativa donde el agente almacena su configuración local
source_root: "TU_CARPETA_LOCAL/" # Debe terminar en /

# Definición de flujo bidireccional
mapping:
  # INBOUND: Desde el Agente hacia el Puente Universal .agents
  inbound:
    - from: "rules/"
      to: "rules/"
      format: "directory"
    - from: "skills/"
      to: "skills/"
      format: "directory"
    - from: "workflows/"
      to: "workflows/"
      format: "directory"

  # OUTBOUND: Desde el Puente Universal .agents hacia el Agente
  outbound:
    - from: "rules/"
      to: "rules/"
    - from: "skills/"
      to: "skills/"
    - from: "workflows/"
      to: "workflows/"

# Carpeta de almacenamiento universal objetivo
target_standard: ".agents/"
```

Responde UNICAMENTE con el bloque de código YAML. El archivo debe guardarse en `.agents/.ai/rules/TU_ID.yaml`.
