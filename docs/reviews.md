# Sistema de Reviews - SmartWell

## Descripción General

El sistema de reviews permite a los pacientes calificar y comentar sobre sus experiencias con los profesionales después de completar una sesión. Incluye moderación de contenido para asegurar la calidad de las calificaciones publicadas.

## Características Principales

### 1. **Calificaciones de Profesionales**
- Sistema de 5 estrellas
- Comentarios de texto (10-500 caracteres)
- Solo disponible para citas completadas
- Un review por cita

### 2. **Moderación de Reviews**
- Todas las reviews pasan por moderación antes de publicarse
- Estados: `pending`, `approved`, `rejected`
- Panel de moderación para administradores
- Notas de moderación opcionales

### 3. **Estadísticas y Visualización**
- Promedio de calificación
- Distribución de ratings (1-5 estrellas)
- Total de reviews
- Actualización automática del perfil del profesional

## Estructura de Datos

### Review
```typescript
interface Review {
    id: string;
    professionalId: string;
    patientId: string;
    patientName: string;
    appointmentId: string;
    rating: number; // 1-5
    comment: string;
    createdAt: Timestamp;
    status: "pending" | "approved" | "rejected";
    moderatedBy?: string;
    moderatedAt?: Timestamp;
    moderationNote?: string;
}
```

### ReviewStats
```typescript
interface ReviewStats {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
}
```

## Flujo de Usuario

### Para Pacientes

1. **Completar una sesión**
   - La cita debe tener status `completed`

2. **Acceder a calificar**
   - Desde "Panel de Usuario > Mis Turnos > Historial"
   - Click en botón "Calificar" en citas completadas

3. **Dejar calificación**
   - Seleccionar estrellas (1-5)
   - Escribir comentario (mínimo 10 caracteres)
   - Enviar

4. **Moderación**
   - La review queda en estado `pending`
   - Aparece mensaje de confirmación
   - Se notifica al paciente cuando es aprobada/rechazada

### Para Administradores

1. **Acceder al panel**
   - Ruta: `/admin/moderacion`
   - Requiere autenticación como admin

2. **Revisar reviews pendientes**
   - Ver todas las reviews en estado `pending`
   - Leer comentario y calificación

3. **Moderar**
   - **Aprobar**: Publica la review y actualiza el rating del profesional
   - **Rechazar**: Requiere nota explicativa, no se publica

## Componentes

### `ReviewForm`
Formulario para crear una nueva review.

**Props:**
- `professionalId`: ID del profesional
- `professionalName`: Nombre del profesional
- `appointmentId`: ID de la cita
- `onSubmit`: Callback al enviar
- `onCancel`: Callback al cancelar

**Ubicación:** `/src/components/ReviewForm.tsx`

### `ReviewList`
Lista de reviews con diseño de tarjetas.

**Props:**
- `reviews`: Array de reviews
- `loading`: Estado de carga

**Ubicación:** `/src/components/ReviewList.tsx`

### `ReviewStatsDisplay`
Muestra estadísticas de calificación.

**Props:**
- `stats`: Objeto ReviewStats

**Ubicación:** `/src/components/ReviewStatsDisplay.tsx`

## Funciones Principales

### `createReview()`
Crea una nueva review.

```typescript
await createReview(
    professionalId: string,
    patientId: string,
    patientName: string,
    appointmentId: string,
    rating: number,
    comment: string
): Promise<string>
```

**Validaciones:**
- Rating entre 1-5
- Cita existe y está completada
- Usuario es el paciente de la cita
- No existe review previa para esta cita

### `getProfessionalReviews()`
Obtiene reviews de un profesional.

```typescript
await getProfessionalReviews(
    professionalId: string,
    includeAll: boolean = false,
    maxReviews: number = 50
): Promise<Review[]>
```

**Parámetros:**
- `includeAll`: Si es `true`, incluye reviews pendientes/rechazadas
- Por defecto solo retorna reviews aprobadas

### `getReviewStats()`
Calcula estadísticas de reviews.

```typescript
await getReviewStats(
    professionalId: string
): Promise<ReviewStats>
```

### `moderateReview()`
Aprueba o rechaza una review.

```typescript
await moderateReview(
    reviewId: string,
    status: "approved" | "rejected",
    moderatorId: string,
    moderationNote?: string
): Promise<void>
```

**Efectos:**
- Actualiza el status de la review
- Si se aprueba, actualiza el rating del profesional
- Registra quién y cuándo moderó

### `canReviewAppointment()`
Verifica si un usuario puede calificar una cita.

```typescript
await canReviewAppointment(
    appointmentId: string,
    userId: string
): Promise<{ canReview: boolean; reason?: string }>
```

## Páginas

### `/calificar/[id]`
Página para calificar una cita específica.

**Características:**
- Verifica elegibilidad automáticamente
- Muestra información de la cita
- Formulario de calificación
- Pantalla de éxito con opciones de navegación

### `/admin/moderacion`
Panel de moderación para administradores.

**Características:**
- Lista de reviews pendientes
- Acciones de aprobar/rechazar
- Notas de moderación
- Actualización en tiempo real

### `/profesionales/[id]`
Perfil del profesional (actualizado).

**Nuevas secciones:**
- Estadísticas de calificación
- Lista de reviews aprobadas
- Distribución de ratings

## Reglas de Firestore

```javascript
// Colección: reviews
match /reviews/{reviewId} {
  // Lectura: cualquier usuario autenticado
  allow read: if request.auth != null;
  
  // Creación: solo el paciente de la cita
  allow create: if request.auth != null 
    && request.resource.data.patientId == request.auth.uid
    && request.resource.data.status == 'pending';
  
  // Actualización: solo admins (moderación)
  allow update: if request.auth != null 
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
  
  // Eliminación: solo admins
  allow delete: if request.auth != null 
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

## Índices Requeridos en Firestore

### Índice 1: Reviews por profesional (aprobadas)
- Colección: `reviews`
- Campos:
  - `professionalId` (Ascending)
  - `status` (Ascending)
  - `createdAt` (Descending)

### Índice 2: Reviews pendientes
- Colección: `reviews`
- Campos:
  - `status` (Ascending)
  - `createdAt` (Descending)

### Índice 3: Reviews por cita
- Colección: `reviews`
- Campos:
  - `appointmentId` (Ascending)

## Mejoras Futuras

1. **Respuestas de Profesionales**
   - Permitir que profesionales respondan a reviews
   - Mostrar respuestas en el perfil

2. **Reportes de Reviews**
   - Sistema para reportar reviews inapropiadas
   - Moderación reactiva

3. **Filtros Avanzados**
   - Filtrar por rating
   - Ordenar por fecha/relevancia
   - Búsqueda en comentarios

4. **Notificaciones**
   - Notificar al paciente cuando su review es moderada
   - Notificar al profesional de nuevas reviews

5. **Analytics**
   - Dashboard de estadísticas para profesionales
   - Tendencias de calificación en el tiempo
   - Comparación con promedio de la plataforma

6. **Verificación de Reviews**
   - Badge de "Cita Verificada"
   - Destacar reviews de pacientes recurrentes

## Testing

### Casos de Prueba

1. **Crear Review**
   - ✅ Paciente puede calificar cita completada
   - ✅ No puede calificar cita pendiente
   - ✅ No puede calificar cita de otro usuario
   - ✅ No puede calificar dos veces la misma cita
   - ✅ Rating debe estar entre 1-5
   - ✅ Comentario debe tener mínimo 10 caracteres

2. **Moderación**
   - ✅ Admin puede aprobar review
   - ✅ Admin puede rechazar review con nota
   - ✅ Rating del profesional se actualiza al aprobar
   - ✅ Review aprobada aparece en perfil

3. **Visualización**
   - ✅ Solo reviews aprobadas son visibles públicamente
   - ✅ Estadísticas se calculan correctamente
   - ✅ Distribución de ratings es precisa

## Soporte

Para preguntas o problemas con el sistema de reviews:
- Documentación: `/docs/reviews.md`
- Issues: GitHub Issues
- Email: dev@smartwell.com
