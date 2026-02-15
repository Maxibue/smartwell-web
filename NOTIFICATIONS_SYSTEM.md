# 🔔 Sistema de Notificaciones en Tiempo Real - SmartWell

## 📋 Descripción General

Sistema completo de notificaciones en tiempo real implementado con Firebase Firestore, que permite a usuarios y profesionales recibir actualizaciones instantáneas sobre turnos, cancelaciones y recordatorios.

---

## 🏗️ Arquitectura del Sistema

### **Componentes Principales:**

1. **`src/lib/notifications.ts`** - Lógica de negocio y funciones de Firestore
2. **`src/hooks/useNotifications.ts`** - Hook personalizado de React
3. **`src/components/NotificationsDropdown.tsx`** - Componente UI del dropdown
4. **`src/contexts/AuthContext.tsx`** - Contexto de autenticación

---

## 📊 Modelo de Datos (Firestore)

### **Colección: `notifications`**

```typescript
{
  id: string;                    // ID auto-generado por Firestore
  userId: string;                // ID del usuario receptor
  type: NotificationType;        // Tipo de notificación
  title: string;                 // Título de la notificación
  message: string;               // Mensaje descriptivo
  read: boolean;                 // Estado de lectura
  createdAt: Timestamp;          // Fecha de creación
  
  // Campos opcionales
  appointmentId?: string;
  professionalId?: string;
  patientId?: string;
  actionUrl?: string;            // URL para navegar al hacer click
  
  metadata?: {
    professionalName?: string;
    patientName?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    oldDate?: string;
    oldTime?: string;
    newDate?: string;
    newTime?: string;
  };
}
```

### **Tipos de Notificaciones:**

| Tipo | Descripción | Ícono | Color |
|------|-------------|-------|-------|
| `appointment_booked` | Nuevo turno reservado | 📅 | Azul |
| `appointment_confirmed` | Turno confirmado | ✅ | Verde |
| `appointment_cancelled` | Turno cancelado | ❌ | Rojo |
| `appointment_rescheduled` | Turno reagendado | 📅 | Naranja |
| `appointment_reminder` | Recordatorio de turno | ⏰ | Amarillo |
| `message_received` | Mensaje recibido (futuro) | 💬 | Gris |
| `payment_received` | Pago recibido (futuro) | 💰 | Verde |

---

## 🔧 Funciones Principales

### **1. Crear Notificación**

```typescript
import { createNotification } from '@/lib/notifications';

await createNotification({
  userId: 'user123',
  type: 'appointment_booked',
  title: '🔔 Nuevo Turno Reservado',
  message: 'Juan Pérez ha reservado un turno para el 20/02/2026',
  appointmentId: 'apt123',
  actionUrl: '/panel-profesional/turnos',
  metadata: {
    patientName: 'Juan Pérez',
    appointmentDate: '20/02/2026',
    appointmentTime: '14:00',
  },
});
```

### **2. Notificaciones Específicas (Helper Functions)**

#### **Notificar Profesional - Nuevo Turno**
```typescript
import { notifyProfessionalNewAppointment } from '@/lib/notifications';

await notifyProfessionalNewAppointment({
  professionalId: 'prof123',
  patientName: 'Juan Pérez',
  appointmentId: 'apt123',
  date: '20/02/2026',
  time: '14:00',
});
```

#### **Notificar Paciente - Turno Confirmado**
```typescript
import { notifyPatientAppointmentConfirmed } from '@/lib/notifications';

await notifyPatientAppointmentConfirmed({
  patientId: 'patient123',
  professionalName: 'Dra. María González',
  appointmentId: 'apt123',
  date: '20/02/2026',
  time: '14:00',
});
```

#### **Notificar Cancelación**
```typescript
import { notifyAppointmentCancelled } from '@/lib/notifications';

await notifyAppointmentCancelled({
  userId: 'user123',
  userType: 'patient',
  otherPartyName: 'Dra. María González',
  appointmentId: 'apt123',
  date: '20/02/2026',
  time: '14:00',
  reason: 'Emergencia personal',
});
```

#### **Notificar Reagendamiento**
```typescript
import { notifyAppointmentRescheduled } from '@/lib/notifications';

await notifyAppointmentRescheduled({
  userId: 'user123',
  userType: 'professional',
  otherPartyName: 'Juan Pérez',
  appointmentId: 'apt123',
  oldDate: '20/02/2026',
  oldTime: '14:00',
  newDate: '21/02/2026',
  newTime: '15:00',
});
```

#### **Notificar Recordatorio**
```typescript
import { notifyAppointmentReminder } from '@/lib/notifications';

await notifyAppointmentReminder({
  userId: 'user123',
  userType: 'patient',
  otherPartyName: 'Dra. María González',
  appointmentId: 'apt123',
  date: '20/02/2026',
  time: '14:00',
  hoursUntil: 24,
});
```

---

## 🎣 Hook de React: `useNotifications`

### **Uso Básico:**

```typescript
import { useNotifications } from '@/hooks/useNotifications';

function MyComponent() {
  const {
    notifications,           // Todas las notificaciones
    unreadNotifications,     // Solo no leídas
    recentNotifications,     // Últimas 10
    unreadCount,             // Contador de no leídas
    loading,                 // Estado de carga
    markAsRead,              // Marcar una como leída
    markAllAsRead,           // Marcar todas como leídas
  } = useNotifications();

  return (
    <div>
      <p>Notificaciones no leídas: {unreadCount}</p>
      {recentNotifications.map(notif => (
        <div key={notif.id} onClick={() => markAsRead(notif.id)}>
          {notif.title}
        </div>
      ))}
    </div>
  );
}
```

---

## 🎨 Componente UI: `NotificationsDropdown`

### **Características:**

- ✅ Badge animado con contador de notificaciones no leídas
- ✅ Dropdown con lista de notificaciones recientes
- ✅ Iconos dinámicos según tipo de notificación
- ✅ Formato de tiempo relativo ("hace 5 minutos")
- ✅ Indicador visual de notificaciones no leídas
- ✅ Click para marcar como leída y navegar
- ✅ Botón "Marcar todas como leídas"
- ✅ Cierre automático al hacer click fuera
- ✅ Responsive (desktop y mobile)

### **Integración:**

```typescript
import { NotificationsDropdown } from '@/components/NotificationsDropdown';

function Header() {
  return (
    <header>
      <NotificationsDropdown />
    </header>
  );
}
```

---

## 🔄 Flujo de Trabajo Completo

### **Ejemplo: Reserva de Turno**

```typescript
// 1. Cuando se crea un turno en /app/reservar/page.tsx
import { 
  notifyProfessionalNewAppointment,
  notifyPatientAppointmentConfirmed 
} from '@/lib/notifications';

// Crear el turno en Firestore
const appointmentRef = await addDoc(collection(db, 'appointments'), {
  // ... datos del turno
});

// 2. Notificar al profesional
await notifyProfessionalNewAppointment({
  professionalId: professionalData.id,
  patientName: patientData.name,
  appointmentId: appointmentRef.id,
  date: selectedDate,
  time: selectedTime,
});

// 3. Notificar al paciente
await notifyPatientAppointmentConfirmed({
  patientId: currentUser.uid,
  professionalName: professionalData.name,
  appointmentId: appointmentRef.id,
  date: selectedDate,
  time: selectedTime,
});

// 4. Las notificaciones aparecen INSTANTÁNEAMENTE en el UI
// gracias al listener de Firestore en useNotifications
```

---

## 📱 Integración en Layouts

### **Panel Profesional:**

Ya integrado en `/app/panel-profesional/layout.tsx`:

```typescript
<header className="hidden md:flex bg-white border-b p-4">
  <div className="flex items-center gap-4">
    <NotificationsDropdown />
  </div>
</header>
```

### **Panel Usuario:**

Para agregar en `/app/panel-usuario/layout.tsx`:

```typescript
import { NotificationsDropdown } from '@/components/NotificationsDropdown';

// Agregar en el header del layout
<NotificationsDropdown />
```

---

## 🔐 Reglas de Seguridad de Firestore

### **Configuración Recomendada:**

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Notificaciones
    match /notifications/{notificationId} {
      // Solo el usuario puede leer sus propias notificaciones
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      
      // Solo el sistema puede crear notificaciones
      allow create: if request.auth != null;
      
      // Solo el usuario puede actualizar sus notificaciones (marcar como leída)
      allow update: if request.auth != null && 
                       resource.data.userId == request.auth.uid &&
                       request.resource.data.diff(resource.data).affectedKeys()
                         .hasOnly(['read']);
      
      // No se pueden eliminar notificaciones
      allow delete: if false;
    }
  }
}
```

---

## 🚀 Próximos Pasos

### **1. Automatización de Recordatorios**

Crear una Cloud Function que se ejecute diariamente:

```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const sendDailyReminders = functions.pubsub
  .schedule('every day 09:00')
  .timeZone('America/Argentina/Buenos_Aires')
  .onRun(async (context) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Buscar turnos para mañana
    const appointmentsSnapshot = await admin.firestore()
      .collection('appointments')
      .where('date', '==', tomorrow.toISOString().split('T')[0])
      .get();
    
    // Crear notificaciones de recordatorio
    const promises = appointmentsSnapshot.docs.map(doc => {
      const appointment = doc.data();
      return notifyAppointmentReminder({
        userId: appointment.patientId,
        userType: 'patient',
        otherPartyName: appointment.professionalName,
        appointmentId: doc.id,
        date: appointment.date,
        time: appointment.time,
        hoursUntil: 24,
      });
    });
    
    await Promise.all(promises);
  });
```

### **2. Notificaciones Push (Opcional)**

Implementar Firebase Cloud Messaging:

1. Configurar FCM en Firebase Console
2. Solicitar permisos al usuario
3. Guardar tokens FCM en Firestore
4. Enviar notificaciones push desde Cloud Functions

### **3. Centro de Notificaciones Completo**

Crear página `/notificaciones` con:
- Historial completo de notificaciones
- Filtros por tipo
- Paginación
- Búsqueda

---

## 📊 Métricas y Monitoreo

### **Queries Útiles:**

```typescript
// Notificaciones no leídas por usuario
const unreadQuery = query(
  collection(db, 'notifications'),
  where('userId', '==', userId),
  where('read', '==', false)
);

// Notificaciones de las últimas 24 horas
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

const recentQuery = query(
  collection(db, 'notifications'),
  where('userId', '==', userId),
  where('createdAt', '>=', Timestamp.fromDate(yesterday)),
  orderBy('createdAt', 'desc')
);
```

---

## ✅ Checklist de Implementación

- [x] Modelo de datos de notificaciones
- [x] Funciones de creación de notificaciones
- [x] Hook personalizado `useNotifications`
- [x] Componente UI `NotificationsDropdown`
- [x] Contexto de autenticación `AuthContext`
- [x] Integración en panel profesional
- [ ] Integración en panel usuario
- [ ] Reglas de seguridad de Firestore
- [ ] Cloud Function para recordatorios automáticos
- [ ] Página de centro de notificaciones
- [ ] Notificaciones push (opcional)
- [ ] Tests unitarios
- [ ] Documentación de API

---

## 🐛 Troubleshooting

### **Las notificaciones no aparecen en tiempo real:**

1. Verificar que el usuario esté autenticado
2. Verificar que el `userId` en la notificación coincida con el usuario actual
3. Verificar las reglas de seguridad de Firestore
4. Revisar la consola del navegador para errores

### **El contador no se actualiza:**

1. Verificar que el listener de Firestore esté activo
2. Verificar que el campo `read` se esté actualizando correctamente
3. Revisar el hook `useNotifications`

---

## 📚 Recursos Adicionales

- [Firestore Real-time Updates](https://firebase.google.com/docs/firestore/query-data/listen)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [React Context API](https://react.dev/reference/react/useContext)
- [Custom React Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)

---

**Última actualización:** 15/02/2026
**Versión:** 1.0.0
**Autor:** SmartWell Development Team
