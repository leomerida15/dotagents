# DotAI VSCode Extension

Template básico para la extensión de VSCode de DotAI.

## Desarrollo

1. Instala las dependencias (desde la raíz o en este directorio):
   ```bash
   bun install
   ```

2. Compila la extensión:
   ```bash
   bun run build
   ```

3. Para probar:
   - Abre este proyecto en VS Code.
   - Presiona `F5` para lanzar una nueva ventana con la extensión cargada.
   - Ejecuta el comando `DotAI: Hello World` desde la paleta de comandos (`Ctrl+Shift+P`).

## Estructura

- `src/extension.ts`: Punto de entrada de la extensión.
- `package.json`: Configuración de la extensión y comandos.
- `tsconfig.json`: Configuración de TypeScript.
