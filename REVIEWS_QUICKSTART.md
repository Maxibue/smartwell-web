# 🚀 Guía Rápida: Sistema de Reviews

## Inicio Rápido (5 minutos)

### 1. Desplegar Configuración de Firestore

```bash
# Opción A: Usar el script automático
./scripts/deploy-firestore.sh

# Opción B: Manual
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 2. Configurar un Usuario Admin

En Firebase Console:
1. Ve a Firestore Database
2. Abre la colección `users`
3. Encuentra tu usuario
4. Agrega el campo: `role: "admin"`

### 3. Crear una Cita de Prueba

```javascript
// En Firestore, crea un documento en 'appointments':
{
  patientId: "tu-user-id",
  professionalId: "algun-professional-id",
  professionalName: "Dr. Juan Pérez",
  professionalTitle: "Dr.",
  date: "2026-02-10",
  time: "15:00",
  status: "completed",  // ⚠️ Importante: debe estar completada
  duration: 50,
  price: 5000
}
```

### 4. Probar el Flujo

1. **Calificar una cita:**
   - Ve a `/panel-usuario/turnos`
   - Click en tab "Historial"
   - Click en "Calificar" en una cita completada
   - Deja una calificación de 5 estrellas
   - Escribe un comentario
   - Enviar

2. **Moderar la review:**
   - Ve a `/admin/moderacion`
   - Verás la review pendiente
   - Click en "Moderar"
   - Click en "Aprobar"

3. **Ver la review publicada:**
   - Ve al perfil del profesional
   - Scroll hasta "Calificaciones y Reseñas"
   - Verás la review aprobada

## 📋 Checklist de Configuración

- [ ] Reglas de Firestore desplegadas
- [ ] Índices de Firestore creados
- [ ] Usuario admin configurado
- [ ] Cita de prueba creada (status: completed)
- [ ] Review de prueba creada
- [ ] Review moderada y aprobada
- [ ] Review visible en perfil del profesional

## 🎯 Endpoints Principales

| Ruta | Descripción |
|------|-------------|
| `/calificar/[id]` | Calificar una cita específica |
| `/admin/moderacion` | Panel de moderación (solo admins) |
| `/profesionales/[id]` | Ver reviews en perfil del profesional |
| `/panel-usuario/turnos` | Acceder a calificar desde historial |

## 🔧 Funciones Útiles

### Crear una review programáticamente

```typescript
import { createReview } from '@/lib/reviews';

await createReview(
  'professional-id',
  'patient-id',
  'Juan Pérez',
  'appointment-id',
  5,
  'Excelente profesional, muy recomendado!'
);
```

### Obtener reviews de un profesional

```typescript
import { getProfessionalReviews } from '@/lib/reviews';

const reviews = await getProfessionalReviews('professional-id');
console.log(reviews);
```

### Obtener estadísticas

```typescript
import { getReviewStats } from '@/lib/reviews';

const stats = await getReviewStats('professional-id');
console.log(stats.averageRating); // 4.5
console.log(stats.totalReviews);  // 10
```

## 🐛 Troubleshooting

### "No puedes calificar esta cita"

**Causas comunes:**
- La cita no está en status `completed`
- Ya existe una review para esta cita
- No eres el paciente de la cita

**Solución:**
```javascript
// Verificar en Firestore:
appointments/{appointmentId}
{
  status: "completed",  // ✅ Debe ser "completed"
  patientId: "tu-id",   // ✅ Debe ser tu ID
  hasReview: false      // ✅ No debe tener review
}
```

### Reviews no aparecen en el perfil

**Causas comunes:**
- La review está en status `pending`
- Falta aprobar desde el panel de moderación

**Solución:**
1. Ve a `/admin/moderacion`
2. Aprueba la review
3. Refresca el perfil del profesional

### Error de índices en Firestore

**Mensaje:** "The query requires an index"

**Solución:**
```bash
# Desplegar índices
firebase deploy --only firestore:indexes

# O crear manualmente desde el link en el error
```

## 📊 Datos de Prueba

### Review de ejemplo

```javascript
{
  professionalId: "prof-123",
  patientId: "patient-456",
  patientName: "María González",
  appointmentId: "apt-789",
  rating: 5,
  comment: "Excelente atención, muy profesional y empático. Recomendado 100%",
  status: "pending",
  createdAt: Timestamp.now()
}
```

### Stats esperados

```javascript
{
  averageRating: 4.7,
  totalReviews: 15,
  ratingDistribution: {
    5: 10,
    4: 3,
    3: 1,
    2: 1,
    1: 0
  }
}
```

## 🎨 Personalización

### Cambiar límite de caracteres

En `src/components/ReviewForm.tsx`:
```typescript
maxLength={500}  // Cambiar a tu preferencia
```

### Cambiar límite de reviews mostradas

En `src/lib/reviews.ts`:
```typescript
export async function getProfessionalReviews(
    professionalId: string,
    includeAll: boolean = false,
    maxReviews: number = 50  // Cambiar aquí
)
```

### Personalizar mensajes

En `src/components/ReviewForm.tsx`:
```typescript
{rating === 5 && "Muy satisfecho"}  // Personalizar textos
```

## 📚 Recursos Adicionales

- 📖 [Documentación completa](./docs/reviews.md)
- 🎯 [Resumen de implementación](./REVIEWS_IMPLEMENTATION.md)
- 🔐 [Reglas de Firestore](./firestore.rules)
- 📊 [Índices de Firestore](./firestore.indexes.json)

## ✅ Próximos Pasos

1. [ ] Configurar notificaciones para reviews moderadas
2. [ ] Agregar respuestas de profesionales
3. [ ] Implementar sistema de reportes
4. [ ] Agregar filtros avanzados
5. [ ] Dashboard de analytics para profesionales

---

**¿Necesitas ayuda?** Consulta la documentación completa en `docs/reviews.md`
