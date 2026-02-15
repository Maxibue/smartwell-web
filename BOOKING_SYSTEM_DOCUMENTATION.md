# 📅 Sistema de Reservas - SmartWell

## Resumen

El sistema de reservas de SmartWell permite a los usuarios reservar turnos con profesionales de salud de manera simple y eficiente. Incluye gestión de disponibilidad, calendario interactivo, confirmación de reservas y notificaciones por email.

---

## 🎯 Características Principales

### 1. **Configuración de Disponibilidad (Profesionales)**
- Configuración de horarios semanales por día
- Múltiples bloques horarios por día
- Duración de sesión personalizable
- Tiempo de buffer entre sesiones
- Guardado en Firestore en tiempo real

**Ubicación:** `/panel-profesional/disponibilidad`

### 2. **Calendario de Reservas (Usuarios)**
- Visualización de disponibilidad del profesional
- Selección de fecha y hora
- Indicadores visuales de horarios disponibles/ocupados
- Cálculo automático de slots según configuración
- Estados de carga y manejo de errores

**Componente:** `src/components/BookingCalendar.tsx`

### 3. **Confirmación de Reservas**
- Resumen de la reserva antes de confirmar
- Creación de appointment en Firestore
- Envío de emails de confirmación
- Redirección automática al panel de turnos

**Ubicación:** `/reservar?professional={id}`

### 4. **Notificaciones por Email**
- Email de confirmación al paciente
- Email de notificación al profesional
- Templates HTML profesionales y responsive
- Manejo de errores (la reserva se crea aunque falle el email)

**Servicio:** `src/lib/email.ts`

---

## 🏗️ Arquitectura

### Estructura de Datos en Firestore

#### Collection: `professionals`
```typescript
{
  firstName: string;
  lastName: string;
  title: string;
  specialty: string;
  category: string;
  price: number;
  sessionDuration: number;
  bufferTime: number;
  status: 'pending' | 'approved' | 'rejected';
  availability: {
    monday: {
      enabled: boolean;
      slots: Array<{ start: string; end: string }>;
    };
    // ... otros días
  };
  email: string;
  profileImage?: string;
  rating?: number;
  reviewCount?: number;
}
```

#### Collection: `appointments`
```typescript
{
  userId: string;
  professionalId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  price: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: Timestamp;
  professionalName: string;
  professionalSpecialty: string;
}
```

---

## 🔄 Flujo de Reserva

### Paso 1: Usuario busca profesional
1. Usuario navega a `/profesionales`
2. Selecciona un profesional
3. Ve el perfil en `/profesionales/{id}`

### Paso 2: Selección de fecha y hora
1. Click en "Reservar Turno"
2. Redirección a `/reservar?professional={id}`
3. El sistema carga:
   - Datos del profesional
   - Configuración de disponibilidad
   - Turnos ya reservados
4. Usuario selecciona fecha en el calendario
5. Sistema muestra horarios disponibles
6. Usuario selecciona horario

### Paso 3: Confirmación
1. Usuario revisa resumen de la reserva
2. Click en "Confirmar Reserva"
3. Sistema:
   - Crea documento en `appointments`
   - Obtiene datos del usuario y profesional
   - Envía emails de confirmación
   - Muestra pantalla de éxito
4. Redirección automática a `/panel-usuario/turnos`

---

## 📧 Sistema de Notificaciones

### Configuración de Email

1. **Crear cuenta de aplicación en Gmail:**
   - Ir a [Google Account Security](https://myaccount.google.com/security)
   - Habilitar verificación en 2 pasos
   - Generar contraseña de aplicación

2. **Configurar variables de entorno:**
```env
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_contraseña_de_aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Tipos de Emails

#### 1. Confirmación al Paciente
- **Trigger:** Al crear una reserva
- **Contenido:**
  - Detalles del turno (fecha, hora, profesional)
  - Precio y duración
  - Link al panel de turnos
  - Consejos para la sesión

#### 2. Notificación al Profesional
- **Trigger:** Al crear una reserva
- **Contenido:**
  - Nuevo turno confirmado
  - Datos del paciente
  - Detalles de la sesión
  - Link al panel profesional

#### 3. Recordatorio (Futuro)
- **Trigger:** 24 horas antes del turno
- **Contenido:**
  - Recordatorio de la sesión
  - Link de videollamada
  - Consejos de preparación

---

## 🛠️ Scripts de Utilidad

### Crear Profesional de Prueba

```bash
node scripts/create-test-professional.js
```

Este script crea un profesional completo en Firestore con:
- Información personal y profesional
- Disponibilidad configurada (Lunes a Viernes, 9-17hs)
- Estado aprobado
- Imagen de perfil

**Salida:**
```
✅ Test professional created successfully!
📋 Professional ID: abc123xyz
👤 Name: Lic. María González
💼 Specialty: Psicología Clínica
💰 Price: $45000
📅 Availability: Monday to Friday, 9 AM - 5 PM

🔗 Test URLs:
   Profile: http://localhost:3000/profesionales/abc123xyz
   Booking: http://localhost:3000/reservar?professional=abc123xyz
```

---

## 🧪 Testing

### 1. Configurar Disponibilidad
```
1. Login como profesional
2. Ir a /panel-profesional/disponibilidad
3. Habilitar días de la semana
4. Agregar bloques horarios
5. Configurar duración y buffer
6. Guardar
```

### 2. Crear Reserva
```
1. Ejecutar script de profesional de prueba
2. Copiar ID del profesional
3. Navegar a /reservar?professional={id}
4. Seleccionar fecha
5. Seleccionar horario
6. Confirmar reserva
7. Verificar emails enviados
8. Verificar en /panel-usuario/turnos
```

### 3. Verificar Emails
```
1. Configurar EMAIL_USER y EMAIL_PASSWORD
2. Crear reserva
3. Revisar bandeja de entrada del paciente
4. Revisar bandeja de entrada del profesional
5. Verificar formato y contenido
```

---

## 🐛 Troubleshooting

### Problema: "Profesional no encontrado"
**Causa:** El ID del profesional no existe en Firestore o el documento no tiene los campos requeridos.

**Solución:**
1. Verificar que el profesional existe: Firebase Console > Firestore > professionals
2. Ejecutar script de creación de profesional de prueba
3. Verificar que el estado sea 'approved' (o comentar validación en desarrollo)

### Problema: "No hay horarios disponibles"
**Causa:** El profesional no ha configurado su disponibilidad o el día seleccionado está deshabilitado.

**Solución:**
1. Ir a `/panel-profesional/disponibilidad`
2. Habilitar días de la semana
3. Agregar bloques horarios
4. Guardar configuración

### Problema: Emails no se envían
**Causa:** Variables de entorno no configuradas o credenciales incorrectas.

**Solución:**
1. Verificar `.env.local`:
   ```env
   EMAIL_USER=tu_email@gmail.com
   EMAIL_PASSWORD=tu_app_password
   ```
2. Generar nueva contraseña de aplicación en Google
3. Reiniciar servidor de desarrollo
4. Verificar logs en consola

### Problema: Página de reserva se queda cargando
**Causa:** Error al cargar datos del profesional o disponibilidad.

**Solución:**
1. Abrir DevTools > Console
2. Verificar errores de Firestore
3. Verificar que el profesional tenga el campo `availability`
4. Verificar permisos de Firestore

---

## 📝 Próximos Pasos

### Funcionalidades Pendientes

1. **Sistema de Pagos**
   - Integración con Stripe/MercadoPago
   - Confirmación de pago antes de finalizar reserva
   - Gestión de reembolsos

2. **Videollamadas**
   - Integración con Jitsi/Zoom/Google Meet
   - Generación automática de links
   - Envío de links 15 minutos antes

3. **Recordatorios Automáticos**
   - Cloud Function para enviar recordatorios 24h antes
   - Recordatorio 1 hora antes
   - Notificaciones push

4. **Cancelación y Reprogramación**
   - Permitir cancelar turnos
   - Reprogramar turnos existentes
   - Política de cancelación

5. **Historial Clínico**
   - Notas de sesión
   - Archivos adjuntos
   - Evolución del paciente

---

## 🔐 Seguridad

### Reglas de Firestore Recomendadas

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Professionals collection
    match /professionals/{professionalId} {
      allow read: if true; // Public profiles
      allow write: if request.auth != null && request.auth.uid == professionalId;
    }
    
    // Appointments collection
    match /appointments/{appointmentId} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.uid == resource.data.professionalId);
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.uid == resource.data.professionalId);
    }
  }
}
```

---

## 📚 Referencias

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [date-fns Documentation](https://date-fns.org/)

---

## 👥 Soporte

Para reportar bugs o solicitar nuevas funcionalidades, contactar al equipo de desarrollo.

**Última actualización:** 2026-02-15
