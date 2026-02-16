vscode sera una app en apps/vscode, que contendra la extencion de vscode que usara el paquete diff para sincronizar.

1. detectar que IDE estamos.
2. validar si en local tenemos el directorio .agents y si en su interior esta el directorio .ai si no existe debemos crearla.
3. comprobar en .agents/.ai/rule/{{IDE}}.yaml si existe reglas para este IDE, sino debemos validar usadno el paquete rule para para consultar local o en el repositorio de github si ya existe unas reglas para este IDE
4. si no contamos con reglas para este IDE debemos tener un archivo .md en .ai que contendra un prompt que debes pegar en tu chat con tu herramienta de AI para esta peuda crearte tu archivo de reglas

   Ej: si estas en antigravity, y no contmaos con reglas para este ide, tomas el archivo que esta en .agents/.ai/make_rule_prompt.md lo insertas en el chat del agente y el debe crear sus reglas en .agents/.ai/rules/antigravity.yaml

   con esto todo herramienta de AI para desarrollo de software debe ser capas de auto crear sus reglas de sincronizacion.
5. si la regla ya la tenemos en los repositorios usaremos esas
6. luego de que ya tengamos reglas en .agents/.ai/rules/{{IDE}}.yaml debemos usar el paquete diff que debe crear un archvios de status para saber si nuestro IDE esta sincronizado con el directrio .agents esto esta definido en el paquete diff que usa id de timetamp nuemricos
7. aplicar la sincronizacion clonando y migrando archivos.
