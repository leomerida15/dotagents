EL paquete diff tiene como finalidad ser el core del motor de sincronizacion detectando diferencias y aplanandolas.

1. iniciar configuracion

   - si existe el directorio .ai sino crearla, esta es la carpeta principar para modificar todas las demas, ejemplo si se agrega u nuevo archivo a este se agregara a las otras como .cursor o .agent con su formato especifico,
   - sambien tiene el archivo de configruacion que indica que ide estamos y a cuales sincronizamos, este archivoi contendra un set de reglas para saber que cnombres usa y com ose migra de uno formato a otro (por definir el formato, podeemos investifgar si existe un estandar de archivos para migraciones)
2. detectar en que IDE o herramienta esta, para usar su ficehro como referencia.
   ejemplo si estoy en antigravity debo detectar el directorio .agent.
3. motor de suncronizacion: modulo que se le entrega una serie de reglas de sincronizacion el core de este monot es apnostico a los directorio solo debe saber

   - origen
   - destino
   - mappiny de nombres y formatos
4. al usar lo en las apps recibe una objeto con reglas de migracion que usara como puente el directorio .ai {{IDE_FOLDER}} -> .ai y .ai -> {{IDE_FOLDER}}
5. en el proyecto estara alojado en packages/diff. contendra los modulos

   - config, trabajara con el estado de las reglas y configuracion de IDE. cuales tomar en cuenta y que reglas usar.
   - sync: motor de sibncronizacion
