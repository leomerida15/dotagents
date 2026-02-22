EL paquete diff tiene como finalidad ser el core del motor de sincronizacion detectando diferencias y aplanandolas.

**Conversion de formato:** Implementada. Las reglas YAML usan `source_ext`/`target_ext`; el dominio usa `sourceExt`/`targetExt`. El interprete convierte extensiones durante el sync (ej. `.mdc` ↔ `.md`).

1. iniciar configuracion

   - si existe el directorio .agents sino crearla, esta es la carpeta principar para modificar todas las demas, ejemplo si se agrega u nuevo archivo a este se agregara a las otras como .cursor o .agent con su formato especifico,
   - sambien tiene el archivo de configruacion que indica que ide estamos y a cuales sincronizamos, este archivo contendra un set de reglas para saber que nombres usa y como se migra de un formato a otro. Las reglas deben poder indicar explicitamente que cambio de formato aplicar (extension origen → extension destino).
2. detectar en que IDE o herramienta esta, para usar su ficehro como referencia.
   ejemplo si estoy en antigravity debo detectar el directorio .agent.
3. motor de sincronizacion: modulo que se le entrega una serie de reglas de sincronizacion. El motor debe poder cambiar el formato de los archivos (ej. `.mdc` ↔ `.md` segun el agente). El core es agnostico a los directorios; solo debe saber:

   - origen
   - destino
   - mapping de nombres y formatos (incl. conversion de extension cuando las reglas lo indiquen)
4. al usar lo en las apps recibe una objeto con reglas de migracion que usara como puente el directorio .agents {{IDE_FOLDER}} -> .agents y .agents -> {{IDE_FOLDER}}
5. en el proyecto estara alojado en packages/diff. contendra los modulos

   - config, trabajara con el estado de las reglas y configuracion de IDE. cuales tomar en cuenta y que reglas usar.
   - sync: motor de sibncronizacion
