# 📅 Sistema de Gestión de Turnos - SmartWell

## Resumen

Sistema completo de gestión de turnos que permite a usuarios y profesionales cancelar, reprogramar, filtrar y visualizar el historial completo de sesiones.

---

## ✨ Características Implementadas

### 1. **Cancelación de Turnos** ✅
- Modal de confirmación con detalles del turno
- Política de cancelación (24 horas de anticipación)
- Campo opcional para motivo de cancelación
- Validaciones de estado (no cancelar turnos pasados/completados)
- Actualización automática del estado en Firestore
- Notificación visual de éxito/error

### 2. **Reprogramación de Turnos** ✅
- Modal con calendario integrado
- Visualización del turno actual vs nuevo
- Verificación de disponibilidad en tiempo real
- Historial de reprogramaciones
- Validaciones de conflictos
- Actualización automática

### 3. **Gestión de Estados** ✅
- **Estados disponibles:**
  - `pending` - Turno creado, pago pendiente
  - `confirmed` - Pago confirmado
  - `in_progress` - Sesión en curso
  - `completed` - Sesión finalizada
  - `cancelled` - Turno cancelado
- Badges visuales por estado
- Transiciones automáticas
- Timestamps de cada cambio

### 4. **Historial de Turnos** ✅
- Vista de turnos próximos
- Vista de historial (pasados)
- Filtros por estado
- Ordenamiento cronológico
- Estadísticas básicas

---

## 🏗️ Arquitectura

### Componentes Creados

```
src/
├── lib/
│   └── appointments.ts                    # Servicio de gestión
├── components/
│   ├── CancelAppointmentModal.tsx         # Modal de cancelación
│   └── RescheduleAppointmentModal.tsx     # Modal de reprogramación
└── app/
    └── panel-usuario/
        └── turnos/
            └── page.tsx                   # Página principal actualizada
```

### Firestore Schema Actualizado

```typescript
appointments {
  // Campos existentes
  userId: string;
  professionalId: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  paymentStatus: string;
  createdAt: Timestamp;
  
  // Nuevos campos para gestión
  updatedAt: Timestamp;
  
  // Cancelación
  cancelledAt?: Timestamp;
  cancelledBy?: 'patient' | 'professional';
  cancellationReason?: string;
  
  // Reprogramación
  rescheduleHistory?: Array<{
    oldDate: string;
    oldTime: string;
    newDate: string;
    newTime: string;
    rescheduledAt: Timestamp;
  }>;
  
  // Estados
  startedAt?: Timestamp;
  completedAt?: Timestamp;
}
```

---

## 🔧 Funcionalidades Detalladas

### 1. Cancelación de Turnos

#### Política de Cancelación

```typescript
// Regla: Cancelar hasta 24 horas antes
const CANCELLATION_DEADLINE_HOURS = 24;

// Validaciones:
✓ Turno no pasado
✓ Turno no completado
✓ Turno no ya cancelado
✓ Mínimo 24h de anticipación
```

#### Flujo de Cancelación

```
1. Usuario click en "Cancelar"
   ↓
2. Modal muestra detalles del turno
   ↓
3. Verificación de política
   ├─ ✓ Puede cancelar → Habilitar confirmación
   └─ ✗ No puede cancelar → Mostrar razón
   ↓
4. Usuario confirma (opcional: agregar motivo)
   ↓
5. Actualizar Firestore:
   - status = 'cancelled'
   - cancelledAt = now
   - cancelledBy = 'patient'
   - cancellationReason = motivo
   ↓
6. Cerrar modal y recargar lista
   ↓
7. (Futuro) Enviar email de cancelación
```

#### Uso

```tsx
import CancelAppointmentModal from '@/components/CancelAppointmentModal';

<CancelAppointmentModal
  appointmentId="abc123"
  appointmentDate="2026-02-20"
  appointmentTime="10:00"
  professionalName="Lic. María González"
  userType="patient"
  onClose={() => setShowModal(false)}
  onSuccess={() => {
    // Recargar turnos
    loadAppointments();
  }}
/>
```

---

### 2. Reprogramación de Turnos

#### Validaciones

```typescript
✓ Turno no cancelado
✓ Turno no completado
✓ Nueva fecha/hora disponible
✓ No conflictos con otros turnos
✓ Slot libre en agenda del profesional
```

#### Flujo de Reprogramación

```
1. Usuario click en "Reprogramar"
   ↓
2. Modal muestra:
   - Turno actual
   - Calendario de disponibilidad
   ↓
3. Usuario selecciona nueva fecha/hora
   ↓
4. Verificar disponibilidad en tiempo real
   ├─ ✓ Disponible → Habilitar confirmación
   └─ ✗ No disponible → Mostrar error
   ↓
5. Usuario confirma
   ↓
6. Actualizar Firestore:
   - date = newDate
   - time = newTime
   - Agregar a rescheduleHistory[]
   - updatedAt = now
   ↓
7. Cerrar modal y recargar lista
   ↓
8. (Futuro) Enviar email de confirmación
```

#### Uso

```tsx
import RescheduleAppointmentModal from '@/components/RescheduleAppointmentModal';

<RescheduleAppointmentModal
  appointmentId="abc123"
  professionalId="prof456"
  professionalName="Lic. María González"
  currentDate="2026-02-20"
  currentTime="10:00"
  onClose={() => setShowModal(false)}
  onSuccess={() => {
    // Recargar turnos
    loadAppointments();
  }}
/>
```

---

### 3. Gestión de Estados

#### Transiciones de Estados

```
pending
  ↓ (pago confirmado)
confirmed
  ↓ (usuario se une a videollamada)
in_progress
  ↓ (sesión finaliza)
completed

Desde cualquier estado (excepto completed):
  ↓ (cancelación)
cancelled
```

#### Actualización Manual

```typescript
import { updateAppointmentStatus } from '@/lib/appointments';

// Marcar como en progreso
await updateAppointmentStatus('appointmentId', 'in_progress');

// Marcar como completado
await updateAppointmentStatus('appointmentId', 'completed');
```

#### Actualización Automática (Futuro)

```typescript
// Al unirse a videollamada
onJoinMeeting(() => {
  updateAppointmentStatus(appointmentId, 'in_progress');
});

// Al salir de videollamada
onLeaveMeeting(() => {
  updateAppointmentStatus(appointmentId, 'completed');
});
```

---

### 4. Historial y Filtros

#### Vistas Disponibles

**Próximos Turnos:**
```typescript
// Turnos futuros con estado pending o confirmed
const upcoming = await getUpcomingAppointments(userId, 'patient');
// Ordenados por fecha (más cercano primero)
```

**Historial:**
```typescript
// Turnos pasados, completados o cancelados
const past = await getPastAppointments(userId, 'patient');
// Ordenados por fecha (más reciente primero)
```

#### Filtros

```tsx
// Filtrar por estado
const filtered = appointments.filter(apt => 
  filterStatus === 'all' || apt.status === filterStatus
);

// Estados disponibles en historial:
- Todos
- Completados
- Cancelados
```

---

## 📱 Interfaz de Usuario

### Página de Turnos

#### Tabs de Vista

```
┌─────────────────────────────────────┐
│  [Próximos]  [Historial]            │
└─────────────────────────────────────┘
```

#### Tarjeta de Turno (Próximos)

```
┌─────────────────────────────────────────────────────┐
│ [FEB]  Lic. María González  [Confirmado]           │
│  15    Psicología Clínica                          │
│        🕐 10:00 hs • 50 min • $45000               │
│        ✓ Videollamada disponible                   │
│                                                     │
│        [Unirse] [Reprogramar] [Cancelar]           │
└─────────────────────────────────────────────────────┘
```

#### Tarjeta de Turno (Historial)

```
┌─────────────────────────────────────────────────────┐
│ [ENE]  Dr. Juan Pérez  [Completado]                │
│  20    Medicina General                            │
│        🕐 15:00 hs • 30 min • $35000               │
└─────────────────────────────────────────────────────┘
```

### Modal de Cancelación

```
┌────────────────────────────────────┐
│ Cancelar Turno              [X]    │
├────────────────────────────────────┤
│ ⚠️ ¿Estás seguro?                  │
│   Esta acción no se puede deshacer │
│                                    │
│ Profesional: Lic. María González   │
│ Fecha: Jueves, 20 de febrero       │
│ Hora: 10:00 hs                     │
│                                    │
│ ✓ Podés cancelar (48 horas antes)  │
│                                    │
│ Motivo (opcional):                 │
│ [___________________________]      │
│                                    │
│ [Volver] [Confirmar Cancelación]   │
└────────────────────────────────────┘
```

### Modal de Reprogramación

```
┌────────────────────────────────────────┐
│ Reprogramar Turno            [X]       │
├────────────────────────────────────────┤
│ Turno Actual:                          │
│ 📅 Jueves, 20 de febrero • 🕐 10:00   │
│                                        │
│ Seleccionar Nueva Fecha y Hora:       │
│ [Calendario con slots disponibles]    │
│                                        │
│ Nuevo Turno:                           │
│ 📅 Viernes, 21 de febrero • 🕐 14:00  │
│                                        │
│ [Cancelar] [Confirmar Reprogramación]  │
└────────────────────────────────────────┘
```

---

## 🧪 Testing

### 1. Probar Cancelación

```bash
# 1. Crear turno de prueba
node scripts/create-test-professional.js
# Reservar turno para MAÑANA

# 2. Ir a /panel-usuario/turnos
# 3. Click en "Cancelar"
# 4. Verificar que muestra "Podés cancelar"
# 5. Agregar motivo (opcional)
# 6. Confirmar
# 7. Verificar que el turno aparece como "Cancelado"
```

### 2. Probar Política de Cancelación (< 24h)

```bash
# 1. Crear turno para HOY (en 2 horas)
# 2. Intentar cancelar
# 3. Verificar mensaje: "Solo se puede cancelar con 24 horas de anticipación"
# 4. Botón de confirmación debe estar deshabilitado
```

### 3. Probar Reprogramación

```bash
# 1. Crear turno para MAÑANA
# 2. Click en "Reprogramar"
# 3. Seleccionar nueva fecha (pasado mañana)
# 4. Seleccionar nuevo horario
# 5. Confirmar
# 6. Verificar que el turno se actualizó
# 7. En Firestore, verificar rescheduleHistory[]
```

### 4. Probar Filtros

```bash
# 1. Crear varios turnos:
#    - 1 completado
#    - 1 cancelado
#    - 1 próximo
# 2. Ir a tab "Historial"
# 3. Probar filtros:
#    - Todos (debe mostrar 2)
#    - Completados (debe mostrar 1)
#    - Cancelados (debe mostrar 1)
```

---

## 🐛 Troubleshooting

### Problema: No puedo cancelar un turno

**Posibles causas:**
- Faltan menos de 24 horas
- Turno ya pasó
- Turno ya está cancelado
- Turno ya está completado

**Solución:**
```
1. Verificar la fecha/hora del turno
2. Revisar el mensaje de error en el modal
3. Si es urgente, contactar al profesional directamente
```

### Problema: No aparecen slots al reprogramar

**Posibles causas:**
- Profesional sin disponibilidad configurada
- Todos los slots ocupados
- Error al cargar disponibilidad

**Solución:**
```
1. Verificar que el profesional tenga disponibilidad
2. Probar con otra fecha
3. Recargar la página
4. Contactar al profesional
```

### Problema: El historial está vacío

**Posibles causas:**
- No hay turnos pasados
- Error al cargar desde Firestore
- Usuario no autenticado

**Solución:**
```
1. Verificar que estés autenticado
2. Revisar consola del navegador
3. Verificar en Firestore que existan appointments
4. Verificar que userId coincida
```

---

## 📊 Métricas y Analytics

### Eventos a Trackear

```typescript
// Cancelación
analytics.track('appointment_cancelled', {
  appointmentId,
  cancelledBy: 'patient',
  hoursBeforeSession: 48,
  reason: 'Surgió un imprevisto',
});

// Reprogramación
analytics.track('appointment_rescheduled', {
  appointmentId,
  oldDate: '2026-02-20',
  newDate: '2026-02-21',
  rescheduleCount: 1,
});

// Filtros
analytics.track('appointments_filtered', {
  viewMode: 'past',
  filterStatus: 'completed',
});
```

### KPIs Importantes

- **Tasa de cancelación:** % de turnos cancelados
- **Tasa de reprogramación:** % de turnos reprogramados
- **Tiempo promedio de anticipación:** Horas antes de cancelar
- **Motivos de cancelación:** Top 5 razones
- **Asistencia:** % de turnos completados vs total

---

## 🚀 Próximas Mejoras

### Corto Plazo

1. **Notificaciones por Email**
   - Email al cancelar (paciente y profesional)
   - Email al reprogramar con nueva fecha
   - Confirmación de cambios

2. **Penalizaciones**
   - Límite de cancelaciones por mes
   - Cargo por cancelación tardía
   - Bloqueo temporal por no-shows

3. **Notas de Cancelación**
   - Profesional puede agregar notas
   - Historial de comunicación
   - Razones predefinidas

### Mediano Plazo

4. **Reprogramación Sugerida**
   - IA sugiere mejores horarios
   - Basado en historial del usuario
   - Optimización de agenda

5. **Exportar Historial**
   - PDF con resumen de sesiones
   - CSV para análisis
   - Estadísticas personalizadas

6. **Recordatorios Inteligentes**
   - Recordar reprogramar si cancela
   - Sugerir profesionales similares
   - Follow-up post-cancelación

---

## 📚 API Reference

### `cancelAppointment()`

```typescript
async function cancelAppointment(
  appointmentId: string,
  cancelledBy: 'patient' | 'professional',
  reason?: string
): Promise<{ success: boolean; error?: string }>
```

### `rescheduleAppointment()`

```typescript
async function rescheduleAppointment(
  appointmentId: string,
  newDate: string,
  newTime: string,
  professionalId: string
): Promise<{ success: boolean; error?: string }>
```

### `updateAppointmentStatus()`

```typescript
async function updateAppointmentStatus(
  appointmentId: string,
  newStatus: AppointmentStatus
): Promise<{ success: boolean; error?: string }>
```

### `getUpcomingAppointments()`

```typescript
async function getUpcomingAppointments(
  userId: string,
  userType: 'patient' | 'professional'
): Promise<Appointment[]>
```

### `getPastAppointments()`

```typescript
async function getPastAppointments(
  userId: string,
  userType: 'patient' | 'professional'
): Promise<Appointment[]>
```

---

**Última actualización:** 15 de Febrero, 2026  
**Versión:** 1.0.0  
**Estado:** ✅ Producción Ready
