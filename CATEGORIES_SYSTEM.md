# 🎯 Sistema Centralizado de Categorías Profesionales

## Resumen

Se implementó un sistema centralizado de categorías profesionales para asegurar consistencia en toda la aplicación. Todas las áreas y especialidades ahora se definen en un único archivo de configuración.

---

## ✨ Cambios Implementados

### 1. **Archivo de Configuración Centralizado** ✅

**Ubicación:** `src/lib/categories.ts`

Este archivo contiene:
- Definición de todas las categorías profesionales
- Subcategorías/especialidades para cada categoría
- Funciones helper para acceder a los datos
- Validación de categorías y subcategorías

#### Categorías Principales:

```typescript
1. Salud Mental
   - Psicología Clínica
   - Psicoterapia
   - Terapia Cognitivo-Conductual
   - Psicoanálisis
   - Terapia de Pareja
   - Terapia Familiar
   - Psicología Infantil
   - Psiquiatría
   - Counseling
   - Mindfulness

2. Nutrición Integral
   - Nutrición Clínica
   - Nutrición Deportiva
   - Nutrición en el Embarazo
   - Nutrición Pediátrica
   - Nutrición Vegetariana/Vegana
   - Nutrición Oncológica
   - Educación Alimentaria
   - Trastornos de la Conducta Alimentaria

3. Maternidad y Crianza
   - Asesoría de Lactancia
   - Doula
   - Puericultura
   - Crianza Respetuosa
   - Sueño Infantil
   - Preparación para el Parto
   - Postparto
   - Estimulación Temprana

4. Desarrollo Personal y Profesional
   - Coaching Personal
   - Coaching Profesional
   - Coaching de Carrera
   - Liderazgo
   - Desarrollo de Habilidades
   - Orientación Vocacional
   - Mentoring
   - Inteligencia Emocional
```

---

### 2. **Estructura de Datos**

```typescript
interface ProfessionalCategory {
  id: string;                    // ID único (kebab-case)
  name: string;                  // Nombre para mostrar
  description: string;           // Descripción corta
  icon: string;                  // Nombre del ícono de lucide-react
  color: string;                 // Color de la categoría
  subcategories?: string[];      // Lista de especialidades
}
```

**Ejemplo:**
```typescript
{
  id: 'salud-mental',
  name: 'Salud Mental',
  description: 'Terapia, emociones, vínculos',
  icon: 'Brain',
  color: 'primary',
  subcategories: [
    'Psicología Clínica',
    'Psicoterapia',
    // ...
  ]
}
```

---

### 3. **Funciones Helper**

#### `getCategoryIds()`
Retorna todos los IDs de categorías
```typescript
['salud-mental', 'nutricion-integral', 'maternidad-crianza', 'desarrollo-personal-profesional']
```

#### `getCategoryById(id: string)`
Obtiene una categoría por su ID
```typescript
getCategoryById('salud-mental') // => ProfessionalCategory
```

#### `getCategoryName(id: string)`
Obtiene el nombre de una categoría
```typescript
getCategoryName('salud-mental') // => 'Salud Mental'
```

#### `getSubcategories(categoryId: string)`
Obtiene todas las subcategorías de una categoría
```typescript
getSubcategories('salud-mental') // => ['Psicología Clínica', 'Psicoterapia', ...]
```

#### `getAllSubcategories()`
Obtiene todas las subcategorías de todas las categorías
```typescript
getAllSubcategories() // => ['Psicología Clínica', 'Nutrición Clínica', ...]
```

#### `isValidCategory(id: string)`
Valida si un ID de categoría es válido
```typescript
isValidCategory('salud-mental') // => true
isValidCategory('invalid') // => false
```

#### `isValidSubcategory(subcategory: string)`
Valida si una subcategoría existe
```typescript
isValidSubcategory('Psicología Clínica') // => true
```

#### `getCategoryForSubcategory(subcategory: string)`
Obtiene la categoría padre de una subcategoría
```typescript
getCategoryForSubcategory('Psicología Clínica') // => ProfessionalCategory (Salud Mental)
```

#### `formatCategoryDisplay(categoryId: string, subcategory?: string)`
Formatea una categoría para mostrar
```typescript
formatCategoryDisplay('salud-mental', 'Psicología Clínica') 
// => 'Salud Mental - Psicología Clínica'
```

---

### 4. **Archivos Actualizados**

#### ✅ `/src/app/comenzar/page.tsx`
**Cambios:**
- Importa `PROFESSIONAL_CATEGORIES` y `getSubcategories`
- Usa categorías centralizadas en lugar de hardcoded
- Mapea íconos dinámicamente
- Usa `getSubcategories()` para obtener temas específicos

**Antes:**
```typescript
const categories = [
  { id: "Salud Mental", label: "Salud Mental", ... },
  // ...
];

const topics = {
  "Salud Mental": ["Ansiedad", "Depresión", ...],
  // ...
};
```

**Después:**
```typescript
import { PROFESSIONAL_CATEGORIES, getSubcategories } from "@/lib/categories";

const categories = PROFESSIONAL_CATEGORIES.map(cat => ({
  id: cat.id,
  label: cat.name,
  icon: iconMap[cat.icon],
  desc: cat.description
}));

const getTopicsForCategory = (categoryId: string) => {
  return getSubcategories(categoryId);
};
```

---

#### ✅ `/src/app/panel-profesional/perfil/page.tsx`
**Cambios:**
- Importa `PROFESSIONAL_CATEGORIES` y `getCategoryName`
- Usa categorías centralizadas en el select
- Guarda el ID de la categoría en lugar del nombre

**Antes:**
```typescript
const CATEGORIES = ["Salud Mental", "Nutrición", ...];

<select>
  {CATEGORIES.map(cat => (
    <option key={cat} value={cat}>{cat}</option>
  ))}
</select>
```

**Después:**
```typescript
import { PROFESSIONAL_CATEGORIES, getCategoryName } from "@/lib/categories";

const CATEGORIES = PROFESSIONAL_CATEGORIES.map(cat => ({
  id: cat.id,
  name: cat.name
}));

<select>
  <option value="">Seleccionar categoría</option>
  {CATEGORIES.map(cat => (
    <option key={cat.id} value={cat.id}>{cat.name}</option>
  ))}
</select>
```

---

## 🎨 Beneficios

### 1. **Consistencia**
- Todas las categorías se definen en un solo lugar
- No hay discrepancias entre diferentes partes de la app
- Fácil de mantener y actualizar

### 2. **Escalabilidad**
- Agregar nuevas categorías es simple
- Solo se edita un archivo
- Los cambios se reflejan automáticamente en toda la app

### 3. **Validación**
- Funciones helper para validar categorías
- Previene errores de typos
- Type-safe con TypeScript

### 4. **Flexibilidad**
- Fácil agregar metadata (íconos, colores, descripciones)
- Subcategorías organizadas por categoría
- Funciones helper para acceso rápido

---

## 📝 Cómo Agregar Nuevas Categorías

### Paso 1: Editar `src/lib/categories.ts`

```typescript
export const PROFESSIONAL_CATEGORIES: ProfessionalCategory[] = [
  // ... categorías existentes ...
  {
    id: 'nueva-categoria',
    name: 'Nueva Categoría',
    description: 'Descripción breve',
    icon: 'IconName',  // De lucide-react
    color: 'primary',
    subcategories: [
      'Subcategoría 1',
      'Subcategoría 2',
      'Subcategoría 3',
    ],
  },
];
```

### Paso 2: Agregar el ícono en componentes que lo usen

En `/src/app/comenzar/page.tsx`:
```typescript
const iconMap: Record<string, any> = {
  'Brain': <Brain className="h-6 w-6" />,
  'Heart': <Heart className="h-6 w-6" />,
  'Users': <Users className="h-6 w-6" />,
  'Zap': <Zap className="h-6 w-6" />,
  'IconName': <IconName className="h-6 w-6" />,  // Agregar aquí
};
```

### Paso 3: ¡Listo!
Los cambios se reflejarán automáticamente en:
- Página de "Comenzar" (wizard de búsqueda)
- Perfil profesional (formulario de registro)
- Cualquier otro componente que use las categorías

---

## 🔍 Ejemplos de Uso

### En un Componente

```typescript
import { 
  PROFESSIONAL_CATEGORIES, 
  getCategoryName,
  getSubcategories 
} from '@/lib/categories';

// Mostrar todas las categorías
PROFESSIONAL_CATEGORIES.map(cat => (
  <div key={cat.id}>
    <h3>{cat.name}</h3>
    <p>{cat.description}</p>
  </div>
));

// Obtener nombre de categoría desde ID
const categoryName = getCategoryName('salud-mental');
// => 'Salud Mental'

// Obtener subcategorías
const specialties = getSubcategories('salud-mental');
// => ['Psicología Clínica', 'Psicoterapia', ...]
```

### En Firestore

```typescript
// Guardar profesional con categoría
await setDoc(doc(db, 'professionals', uid), {
  category: 'salud-mental',  // ID de la categoría
  specialty: 'Psicología Clínica',  // Subcategoría
  // ...
});

// Leer y mostrar
const categoryName = getCategoryName(professional.category);
const display = formatCategoryDisplay(
  professional.category, 
  professional.specialty
);
// => 'Salud Mental - Psicología Clínica'
```

---

## 🗄️ Estructura en Firestore

### Colección: `professionals`

```typescript
{
  uid: string;
  name: string;
  category: string;           // ID de categoría: 'salud-mental'
  specialty: string;          // Subcategoría: 'Psicología Clínica'
  // ...
}
```

**Importante:** Ahora guardamos el **ID** de la categoría (`salud-mental`) en lugar del nombre (`Salud Mental`). Esto permite:
- Cambiar el nombre de la categoría sin romper datos existentes
- Búsquedas más eficientes
- Consistencia en la base de datos

---

## 🚀 Próximos Pasos

### Corto Plazo
1. ✅ Actualizar componentes de búsqueda de profesionales
2. ✅ Actualizar filtros en `/profesionales`
3. ✅ Migrar datos existentes en Firestore (si hay)

### Mediano Plazo
4. Agregar más subcategorías según demanda
5. Implementar tags adicionales por profesional
6. Sistema de recomendaciones basado en categorías

---

## 📊 Migración de Datos

Si ya hay profesionales en Firestore con el formato antiguo:

```typescript
// Script de migración (ejecutar una vez)
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PROFESSIONAL_CATEGORIES } from '@/lib/categories';

async function migrateProfessionals() {
  const snapshot = await getDocs(collection(db, 'professionals'));
  
  const categoryMap: Record<string, string> = {
    'Salud Mental': 'salud-mental',
    'Nutrición': 'nutricion-integral',
    'Maternidad': 'maternidad-crianza',
    'Desarrollo Personal': 'desarrollo-personal-profesional',
  };
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const oldCategory = data.category;
    const newCategory = categoryMap[oldCategory];
    
    if (newCategory && newCategory !== oldCategory) {
      await updateDoc(doc(db, 'professionals', docSnap.id), {
        category: newCategory
      });
      console.log(`Migrated ${docSnap.id}: ${oldCategory} -> ${newCategory}`);
    }
  }
}
```

---

## 🎓 Mejores Prácticas

1. **Siempre usar IDs**
   - Guardar `category: 'salud-mental'` en lugar de `category: 'Salud Mental'`
   - Usar `getCategoryName()` para mostrar

2. **Validar antes de guardar**
   ```typescript
   if (!isValidCategory(categoryId)) {
     throw new Error('Categoría inválida');
   }
   ```

3. **Usar funciones helper**
   - No acceder directamente al array
   - Usar `getCategoryById()`, `getSubcategories()`, etc.

4. **Mantener sincronizadas las imágenes**
   - Las categorías en la imagen deben coincidir con `PROFESSIONAL_CATEGORIES`
   - Actualizar ambos cuando se agreguen nuevas categorías

---

**Última actualización:** 15 de Febrero, 2026  
**Versión:** 1.0.0  
**Estado:** ✅ Implementado
