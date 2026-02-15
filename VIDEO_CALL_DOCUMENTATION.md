# 🎥 Sistema de Videollamadas con Jitsi Meet - SmartWell

## Resumen

Sistema completo de videollamadas integrado con Jitsi Meet que permite a pacientes y profesionales realizar sesiones virtuales de manera segura y profesional.

---

## ✨ Características Implementadas

### 1. **Integración con Jitsi Meet** ✅
- SDK de Jitsi Meet External API
- Salas únicas generadas automáticamente
- Configuración personalizada (idioma español, branding)
- Sin límites de tiempo ni costos adicionales

### 2. **Sala de Espera Virtual** ✅
- Cuenta regresiva hasta la sesión
- Verificación de acceso basada en tiempo
- Consejos para la sesión
- Información completa del turno

### 3. **Control de Acceso Temporal** ✅
- Acceso 15 minutos antes de la sesión
- Disponible hasta 30 minutos después
- Mensajes claros sobre disponibilidad
- Actualización automática cada 10 segundos

### 4. **Integración en Turnos** ✅
- Botón "Unirse a la Sesión" en lista de turnos
- Estado visual de disponibilidad
- Link directo a la videollamada
- Deshabilitado cuando no está disponible

### 5. **Notificaciones por Email** ✅
- Link de videollamada en email de confirmación
- Recordatorio de acceso 15 min antes
- Templates HTML profesionales

---

## 🏗️ Arquitectura

### Componentes Creados

```
src/
├── lib/
│   └── jitsi.ts                    # Servicio de Jitsi Meet
├── components/
│   ├── JitsiMeet.tsx               # Componente de videollamada
│   └── WaitingRoom.tsx             # Sala de espera virtual
└── app/
    ├── videollamada/
    │   └── page.tsx                # Página principal de videollamada
    ├── reservar/
    │   └── page.tsx                # Generación de sala al reservar
    └── panel-usuario/
        └── turnos/
            └── page.tsx            # Lista de turnos con acceso

```

### Flujo de Datos

```
1. Usuario reserva turno
   ↓
2. Sistema genera sala de Jitsi única
   ├── meetingRoomName: "SmartWell-abc123..."
   └── meetingUrl: "https://meet.jit.si/SmartWell-abc123..."
   ↓
3. Se guarda en Firestore (appointments)
   ↓
4. Se envía email con link
   ↓
5. Usuario accede 15 min antes
   ↓
6. Sala de espera verifica tiempo
   ↓
7. Si está disponible → Videollamada
   Si no → Mensaje de espera
```

---

## 🔧 Configuración

### Variables de Entorno

Agregar a `.env.local`:

```env
# Jitsi Meet (opcional - usa meet.jit.si por defecto)
NEXT_PUBLIC_JITSI_DOMAIN=meet.jit.si

# URL de la aplicación (requerido)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Firestore Schema

Los appointments ahora incluyen:

```typescript
{
  // ... campos existentes
  meetingRoomName: string;  // Nombre único de la sala
  meetingUrl: string;       // URL completa de Jitsi
  professionalTitle: string; // Ej: "Lic.", "Dr."
}
```

---

## 📱 Uso

### Para Usuarios (Pacientes)

#### 1. Después de Reservar
- Recibirás un email con el link de la videollamada
- El link estará disponible 15 minutos antes de tu sesión

#### 2. Acceder a la Videollamada

**Opción A: Desde el Email**
```
1. Abrir email de confirmación
2. Click en "Acceder a la Videollamada"
3. Esperar en sala de espera si es temprano
4. Unirse cuando esté disponible
```

**Opción B: Desde el Panel de Turnos**
```
1. Ir a /panel-usuario/turnos
2. Ver lista de turnos
3. Click en "Unirse a la Sesión" (habilitado 15 min antes)
4. Acceder directamente a la videollamada
```

#### 3. Durante la Sesión
- Controles de audio/video
- Chat integrado
- Compartir pantalla
- Grabación (si el profesional lo habilita)

### Para Profesionales

#### 1. Recibir Notificación
- Email cuando un paciente reserva
- Incluye link de la videollamada

#### 2. Acceder a la Sesión
```
1. Ir a /panel-profesional/turnos
2. Click en "Unirse a la Sesión"
3. Acceder a la videollamada
```

#### 3. Configuración de la Sala
- Mismos controles que el paciente
- Puede grabar la sesión
- Puede silenciar participantes
- Puede compartir pantalla

---

## 🎨 Características de Jitsi

### Controles Disponibles

- **Audio/Video:** Activar/desactivar micrófono y cámara
- **Chat:** Mensajes de texto durante la sesión
- **Compartir Pantalla:** Mostrar documentos o presentaciones
- **Grabación:** Grabar la sesión (requiere permisos)
- **Fondo Virtual:** Difuminar o cambiar fondo
- **Calidad de Video:** Ajustar según conexión
- **Estadísticas:** Ver calidad de conexión
- **Configuración:** Seleccionar dispositivos

### Configuración Personalizada

```typescript
{
  defaultLanguage: 'es',           // Español por defecto
  startWithAudioMuted: false,      // Audio activado al inicio
  startWithVideoMuted: false,      // Video activado al inicio
  prejoinPageEnabled: true,        // Página de pre-unión
  toolbarButtons: [...],           // Botones personalizados
  SHOW_JITSI_WATERMARK: false,    // Sin marca de agua
  DEFAULT_BACKGROUND: '#1a1a2e',   // Fondo oscuro
}
```

---

## ⏰ Lógica de Acceso Temporal

### Ventana de Acceso

```
Sesión programada: 10:00 AM

├─ 09:45 AM ────────────────────────┐
│  Acceso habilitado                │
│  (15 min antes)                   │
│                                   │
├─ 10:00 AM ────────────────────────┤
│  Hora de inicio                   │
│  Sesión en curso                  │
│                                   │
├─ 11:00 AM ────────────────────────┤
│  Fin programado (60 min)          │
│  Aún disponible                   │
│                                   │
├─ 11:30 AM ────────────────────────┘
   Acceso cerrado
   (30 min después del fin)
```

### Mensajes al Usuario

| Tiempo Restante | Mensaje |
|----------------|---------|
| > 60 minutos | "La videollamada estará disponible X horas antes de tu sesión" |
| 15-60 minutos | "La videollamada estará disponible en X minutos" |
| 0-90 minutos (desde inicio) | "La videollamada está disponible ahora" ✅ |
| > 90 minutos (desde inicio) | "Esta sesión ya finalizó" |

---

## 🔐 Seguridad

### Salas Únicas
Cada turno tiene una sala única generada con:
```typescript
const roomName = `SmartWell-${hash(appointmentId + professionalId + timestamp)}`;
```

### Control de Acceso
- Solo usuarios autenticados
- Verificación de permisos (userId o professionalId)
- Ventana temporal limitada
- Links no compartibles públicamente

### Privacidad
- Sin grabación automática
- Datos no almacenados por Jitsi (modo público)
- Salas eliminadas automáticamente al finalizar
- Encriptación end-to-end (E2EE) disponible

---

## 🧪 Testing

### 1. Crear Turno de Prueba

```bash
# 1. Crear profesional
node scripts/create-test-professional.js

# 2. Reservar turno para HOY
# Ir a /reservar?professional={ID}
# Seleccionar fecha de HOY
# Seleccionar hora ACTUAL + 10 minutos
```

### 2. Probar Sala de Espera

```bash
# 1. Ir a /panel-usuario/turnos
# 2. Ver turno creado
# 3. Botón "Videollamada" debe estar deshabilitado
# 4. Esperar a que falten 15 min
# 5. Botón se habilita automáticamente
```

### 3. Probar Videollamada

```bash
# 1. Click en "Unirse a la Sesión"
# 2. Verificar sala de espera
# 3. Click en "Unirse a la Videollamada"
# 4. Verificar que Jitsi carga correctamente
# 5. Probar controles (audio, video, chat)
```

### 4. Probar con Dos Usuarios

```bash
# Terminal 1 (Paciente)
1. Login como paciente
2. Ir a /videollamada?appointment={ID}
3. Unirse a la sesión

# Terminal 2 (Profesional) - Navegador Incógnito
1. Login como profesional
2. Ir a /videollamada?appointment={ID}
3. Unirse a la sesión

# Verificar que ambos se ven y escuchan
```

---

## 🐛 Troubleshooting

### Problema: "Error al cargar videollamada"

**Causas posibles:**
- Script de Jitsi no cargó
- Bloqueador de ads activo
- Problema de red

**Solución:**
```
1. Desactivar bloqueadores de ads
2. Verificar consola del navegador
3. Recargar la página
4. Probar en navegador incógnito
```

### Problema: No se ve/escucha al otro participante

**Causas posibles:**
- Permisos de cámara/micrófono no otorgados
- Firewall bloqueando WebRTC
- Problema de NAT

**Solución:**
```
1. Verificar permisos del navegador
2. Permitir acceso a cámara y micrófono
3. Verificar configuración de firewall
4. Probar en otra red
```

### Problema: "Turno no encontrado"

**Causas posibles:**
- ID de appointment incorrecto
- Usuario sin permisos
- Appointment no existe en Firestore

**Solución:**
```
1. Verificar URL del appointment
2. Verificar que el usuario esté autenticado
3. Verificar en Firestore que el appointment existe
4. Verificar que userId o professionalId coincidan
```

### Problema: Botón deshabilitado aunque es la hora

**Causas posibles:**
- Hora del sistema incorrecta
- Turno en fecha pasada
- Lógica de tiempo con error

**Solución:**
```
1. Verificar hora del sistema
2. Verificar fecha del turno en Firestore
3. Abrir consola y revisar getTimeUntilMeeting()
4. Refrescar la página
```

---

## 📊 Métricas y Monitoreo

### Eventos a Trackear

```typescript
// Cuando usuario accede a sala de espera
analytics.track('waiting_room_accessed', {
  appointmentId,
  minutesUntilSession,
});

// Cuando usuario se une a videollamada
analytics.track('video_call_joined', {
  appointmentId,
  userType: 'patient' | 'professional',
});

// Cuando usuario sale de videollamada
analytics.track('video_call_left', {
  appointmentId,
  duration: sessionDuration,
});
```

### Métricas Importantes

- Tasa de asistencia a sesiones
- Duración promedio de sesiones
- Problemas técnicos reportados
- Tiempo promedio en sala de espera
- Cancelaciones de último minuto

---

## 🚀 Próximas Mejoras

### Corto Plazo

1. **Recordatorios Automáticos**
   - Email 24h antes con link
   - Email 1h antes con link
   - Notificación push 15 min antes

2. **Grabación de Sesiones**
   - Opción para profesionales
   - Almacenamiento en Cloud Storage
   - Acceso posterior para pacientes

3. **Notas de Sesión**
   - Editor durante la videollamada
   - Guardado automático
   - Compartir con paciente

### Mediano Plazo

4. **Sala de Espera Mejorada**
   - Música de fondo
   - Verificación de audio/video previa
   - Test de conexión

5. **Analytics de Sesión**
   - Calidad de conexión
   - Problemas técnicos
   - Feedback post-sesión

6. **Integración con Calendar**
   - Agregar a Google Calendar
   - Sincronización automática
   - Recordatorios nativos

### Largo Plazo

7. **Jitsi Self-Hosted**
   - Mayor control
   - Branding completo
   - Mejor privacidad

8. **Features Avanzadas**
   - Breakout rooms
   - Pizarra colaborativa
   - Compartir archivos

---

## 📚 Referencias

- [Jitsi Meet External API](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe)
- [Jitsi Meet Configuration](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-configuration)
- [WebRTC Best Practices](https://webrtc.org/getting-started/overview)

---

**Última actualización:** 15 de Febrero, 2026  
**Versión:** 1.0.0  
**Estado:** ✅ Producción Ready
