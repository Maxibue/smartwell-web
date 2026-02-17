# 🔧 WORKAROUND TEMPORAL: Firebase Admin Sin Credenciales

## Problema Actual

Las credenciales de Firebase Admin no se pueden descargar debido a problemas con Chrome y los blobs.

## Solución Temporal

Modificar el código para que funcione sin enviar emails hasta que tengamos las credenciales.

## Pasos para Implementar

### 1. Modificar la API de envío de emails

Edita `src/app/api/send-email/route.ts` para que no falle si no hay credenciales:

```typescript
// En lugar de fallar, registra el intento y continúa
if (!admin) {
  console.warn('⚠️ Firebase Admin not initialized - email not sent');
  return NextResponse.json({
    success: true,
    message: 'Booking confirmed (email pending configuration)',
    warning: 'Email notifications are currently disabled'
  });
}
```

### 2. Actualizar el frontend

Modifica el componente de reserva para mostrar un mensaje apropiado:

```typescript
// Mostrar mensaje diferente si el email no se envió
if (response.warning) {
  toast.success('Turno reservado exitosamente');
  toast.info('Las notificaciones por email estarán disponibles pronto');
} else {
  toast.success('Turno reservado y confirmación enviada por email');
}
```

## Alternativa: Usar Gmail SMTP

Si prefieres tener emails funcionando ahora mismo, podemos usar Gmail SMTP en lugar de Firebase Admin:

### Configurar Gmail SMTP en Vercel

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password  # Generar en Google Account Settings
```

### Ventajas
- ✅ Funciona inmediatamente
- ✅ No requiere Firebase Admin
- ✅ Fácil de configurar

### Desventajas
- ⚠️ Límite de 500 emails/día
- ⚠️ Requiere configurar "App Password" en Gmail

## Recomendación

**Para desarrollo/testing:** Usa el workaround temporal  
**Para producción:** Necesitamos resolver el problema de las credenciales de Firebase

## Próximos Pasos

1. ¿Quieres implementar el workaround temporal?
2. ¿Prefieres configurar Gmail SMTP?
3. ¿O seguimos intentando descargar las credenciales de Firebase?

Avísame cuál opción prefieres y la implemento inmediatamente.
