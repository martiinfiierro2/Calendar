# Validación de multicuenta

La primera versión se fusionó en main en `22ce23a`. Esta revisión desarrolla el flujo de alta e invitación en la rama `multicuenta`, sin una nueva fusión a main.

## Comportamiento

- Un correo tiene un solo usuario y una sola membresía activa. El índice de email tampoco distingue mayúsculas.
- El registro normal permite elegir cuenta individual o familiar, pero la aplicación y las rutas de datos exigen verificar el correo antes de usarla. Cambiar el email vuelve a bloquear el acceso hasta confirmar la nueva dirección.
- El propietario puede convertir individual en familiar conservando los datos. Para volver a individual debe quedar un solo miembro; se cancelan los enlaces pendientes y se conservan los datos de la cuenta.
- Las pantallas distinguen gestión individual y familiar, con el estilo de tarjetas, verde e iconos de la aplicación.
- Crear o renovar una invitación envía el enlace automáticamente al destinatario con Resend. También se puede copiar el enlace o reenviar el correo, con un intervalo mínimo de un minuto. Si el proveedor falla, la interfaz avisa y se conserva la invitación para reintentar. Las invitaciones caducan en siete días y están asociadas al correo invitado. Un enlace reenviado a otra persona no autoriza su entrada. El propietario puede cancelarlo o renovar uno caducado.
- El registro desde una invitación crea un usuario pendiente sin cuenta individual provisional. Solo después de verificar el correo y aceptar explícitamente se incorpora a la familia. Verificar no admite automáticamente.
- Si el usuario ya verificó su correo, no se pide otra verificación. Si tiene una cuenta anterior, la interfaz explica que dejará de acceder a ella y que sus datos no se fusionarán.
- Un registro invitado sin una invitación disponible puede recuperarse con otro enlace para el mismo correo o cancelarse sin afectar a los datos familiares. La cancelación no puede borrar usuarios con cuenta activa.
- El enlace usa un fragmento para evitar enviar el token al servidor web. La página lo retira del historial. La aceptación y el rechazo envían el token en el body; los logs HTTP ocultan los paths heredados con token.
- Se mantienen la privacidad del perfil, los datos compartidos familiares y el borrado del usuario al abandonar o ser expulsado, sin crear una cuenta individual.

## Cobertura ejecutada

- 34 pruebas existentes de utilidades y API con modelos simulados.
- 20 pruebas de cuentas con PostgreSQL real: privacidad, datos familiares, aislamiento, campos internos, roles, concurrencia, propiedad, expulsión, abandono, revocación, bloqueo sin verificación, alta por enlace, email único, conversión a individual y cancelación del registro pendiente.
- 8 pruebas de migraciones con PostgreSQL real: base nueva, esquema anterior a multicuenta, instalación sin consumos, SQL aplicado a mano, rollback/reintento, esquema histórico, copia/restauración y actualización desde la versión con 007 aplicada.
- 11 pruebas de verificación de email: hash, caducidad, uso único/concurrente, reenvío, cambio de correo, fallos del proveedor, contrato Resend y eliminación del registro invitado pendiente.
- 15 pruebas en Chromium con API y PostgreSQL: gestión de cuentas, errores/reintentos, privacidad, registro normal y por enlace, apertura del correo en otra pestaña, conversión, enlace compartible y aceptación sin repetir verificación.
- 1 regresión de seguridad: destinatario sin email verificado rechazado.

Total: 89 pruebas, sin fallos ni pruebas omitidas. También se comprobaron lint, build y las pantallas de activación, invitación y gestión en una pantalla móvil de 390 × 844.

## Preparación del despliegue

1. Configurar Resend en el backend: dominio validado, `RESEND_API_KEY`, `MAIL_FROM` y `FRONTEND_URL`. La recepción externa de correo real sigue pendiente; las pruebas utilizan un buzón controlado y respuestas simuladas del proveedor.
2. Crear una copia de seguridad y aplicar las migraciones pendientes mediante `npm run db:sync`, incluida `008_registro_invitado.sql`, siguiendo `backend/README.md`. Las pruebas no migran la base de desarrollo ni producción.
3. Desplegar conjuntamente backend y frontend. Los usuarios históricos no verificados también deben confirmar el correo antes de acceder a los datos de Calendar.

La invitación elige registro o inicio de sesión según el destinatario, utilizando solo un token vigente. La API prueba que no hay consulta pública por email ni exposición de datos personales y comprueba enlaces caducados/cancelados y coincidencia de sesión. Chromium completa el acceso de un usuario existente y el cambio desde una sesión de otro correo; el registro invitado comprueba que se muestra su formulario directamente.

La revisión visual elimina el bloque persistente del enlace (la copia usa el portapapeles), ordena las hojas CSS para conservar la geometría móvil, mantiene los siete días visibles y comprueba formularios accesibles en pantallas bajas. También prueba una foto de receta fallida con imagen de reserva. Ver `tests/VISUAL_REVIEW.md`.
