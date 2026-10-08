# Revisión visual de multicuenta

Revisión en Chromium con API y PostgreSQL de pruebas, con datos familiares, correos y nombres largos. Se capturaron las pantallas a 320, 390 y 768 píxeles de ancho y se comprobaron los formularios a 390 × 480. Las bases de desarrollo y producción no se modifican.

## Hallazgos corregidos

- El enlace de invitación ocupaba una tarjeta permanente aunque se enviaba por correo. Se elimina la tarjeta y se conserva Copiar enlace, con alternativa de copia para navegadores sin acceso al portapapeles moderno.
- El orden de carga de CSS permitía que los estilos base sobrescribieran la geometría móvil. La semana podía mostrar solo tres días. Se restaura el orden de carga y se comprueba que los siete encabezados caben completamente a distintos anchos.
- Había diferencias en altura, espaciado y tipografía de cabeceras. Se unifican recetas, despensa y perfil y se conservan las cabeceras propias del calendario.
- Los correos largos de invitaciones quedaban comprimidos entre tres acciones. El destinatario pasa a una línea completa y los botones se distribuyen debajo, con tamaños táctiles mayores. Se corrige también la disposición de acciones de miembros.
- Los nombres de productos se cortaban tras pocas palabras. Ahora pueden ocupar dos líneas. Las cantidades de compra, nevera e historial eliminan ceros decimales redundantes y usan el separador español, sin modificar el valor almacenado.
- El selector de compra/nevera utilizaba iconos de calendario y semana. Se sustituyen por compra y nevera y se ajusta el texto al ancho disponible.
- Las hojas de recetas dejaban visible y accesible la navegación inferior. Ahora ocupan el marco de la aplicación y la cubren. Las hojas de perfil, compra y comida pueden desplazarse en pantallas bajas; se verifica que Guardar queda dentro del viewport.
- Las opciones futuras de compra podían comprimir sus tarjetas y superponer las etiquetas Próximamente. Las tarjetas conservan su altura y la lista se desplaza.
- El perfil mostraba campos vacíos cuando la API no proporcionaba raciones o dieta. Se muestran como Sin configurar, sin inventar preferencias ni ampliar la persistencia del backend.
- Las fotos fallidas mostraban imágenes rotas. Se usa una imagen de reserva local en tarjetas, detalle y selector de recetas del calendario.
- Había mensajes de carga/error sin estilo, y algunos errores de recetas no eran visibles con recetas existentes o dentro del formulario. Se presentan con estilos coherentes y roles de estado/alerta.
- Se mejora el contraste del texto secundario y la navegación inactiva, el foco al usar teclado, las áreas seguras y el respeto a movimiento reducido. Los campos móviles mantienen 16px para evitar el zoom automático de iOS.

## Pantallas comprobadas

Día, semana, mes y año; recetas, detalle y alta; compra, nevera, opciones y alta de producto; perfil y edición. Los flujos de registro, verificación e invitación están cubiertos por la suite existente en navegador.

## Validación

La suite completa pasa: 89 pruebas sin fallos ni omitidas. Incluye dos regresiones visuales funcionales nuevas: siete días dentro del viewport y formularios accesibles con navegación cubierta; foto fallida con reserva cargada en tarjeta y detalle. La prueba de copiar invitación exige que no aparezca el campo de enlace y comprueba el texto del portapapeles.

Lint y compilación de producción pasan. La revisión en Chromium no sustituye una comprobación física del teclado y las áreas seguras en Safari/iPhone.
