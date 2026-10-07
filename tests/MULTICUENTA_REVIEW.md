# Validación previa al merge de multicuenta

Validación de los cambios de multicuenta desarrollados sobre `43d48d4`.

## Problema corregido durante las pruebas

El adaptador PostgreSQL de Sequelize transforma consultas que empiezan con `SELECT table_name FROM information_schema.tables`. El runner de migraciones esperaba objetos y concluía erróneamente que una base existente estaba vacía. Se cambió la consulta a una selección explícita con alias. Los casos de actualización desde main y recuperación tras fallo cubren esta regresión.

## Bloqueo resuelto: identidad del invitado

`npm run test:security` reproduce el caso siguiente:

1. El propietario invita un email que todavía no tiene usuario registrado.
2. Un tercero se registra escribiendo ese email, sin comprobar el buzón.
3. La API devuelve las invitaciones de ese email a la sesión del tercero.
4. El tercero intenta aceptar y la API rechaza con HTTP 403 porque su email no está verificado.

La prueba exige rechazar la admisión sin demostrar que controla el email. Cambiar el email desde el perfil invalida la verificación anterior y los enlaces pendientes; el nuevo correo debe confirmarse de nuevo.

La verificación mediante un enlace de un solo uso está implementada. El token se guarda como hash, caduca en 24 horas y no se devuelve por API. La regresión ejecuta el ataque y exige el rechazo, sin omitir ni desactivar la aserción.

## Cobertura ejecutada

- 34 pruebas existentes: utilidades, normalización y API con modelos simulados.
- 10 pruebas de cuentas con PostgreSQL real: privacidad, compartición familiar, ausencia de fusión, aislamiento, campos internos, roles, invitaciones, concurrencia, propiedad, expulsión, abandono y revocación de acceso.
- 7 pruebas de migraciones con PostgreSQL real: base nueva, main, tabla consumos ausente, SQL aplicado a mano, rollback/reintento, esquema histórico y copia/restauración.
- 11 pruebas de verificación de email con PostgreSQL real y transporte de correo controlado.
- 7 pruebas en Chromium: carga fallida/reintento, aceptación, transferencia, abandono y cancelación de confirmación, expulsión/cierre de sesión, cierre normal y renovación/cancelación de invitación y confirmación de email que desbloquea la aceptación.
- 1 regresión de seguridad: destinatario sin email verificado rechazado.

## Pasos restantes

1. Antes de actualizar producción, revisar el procedimiento de migración y realizar una copia de seguridad de la base de datos.
2. Para el envío real, validar un dominio en Resend y configurar RESEND_API_KEY, MAIL_FROM y FRONTEND_URL en el backend. El envío se ha probado con un buzón de pruebas y el contrato Resend con respuestas simuladas; todavía no se ha verificado recepción externa.
3. Antes de desplegar, comprobar una entrega real y aplicar la migración 007 junto con las demás.

Antes de desplegar sobre una base real, crear su copia de seguridad y aplicar el procedimiento de actualización de `backend/README.md`. La restauración se ha comprobado con datos de prueba; no se ha migrado la base de desarrollo ni ninguna base de producción.
