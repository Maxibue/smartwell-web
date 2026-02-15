# 🛠️ Scripts de Utilidad - SmartWell

Este directorio contiene scripts útiles para el desarrollo y testing de la plataforma SmartWell.

---

## 📋 Scripts Disponibles

### 1. `create-test-professional.js`

Crea un profesional de prueba completo en Firestore con toda la información necesaria para testing del sistema de reservas.

#### Requisitos Previos

1. **Service Account Key de Firebase:**
   - Ir a [Firebase Console](https://console.firebase.google.com/)
   - Seleccionar tu proyecto
   - Settings > Service Accounts
   - Click en "Generate New Private Key"
   - Guardar el archivo como `serviceAccountKey.json` en la raíz del proyecto

2. **Instalar dependencias:**
   ```bash
   npm install firebase-admin
   ```

#### Uso

```bash
node scripts/create-test-professional.js
```

#### Output Esperado

```
🔄 Creating test professional...
✅ Test professional created successfully!
📋 Professional ID: kDEkmtkaW6cuBP42Q5K9qHX7grH2
👤 Name: Lic. María González
💼 Specialty: Psicología Clínica
💰 Price: $45000
📅 Availability: Monday to Friday, 9 AM - 5 PM

🔗 Test URLs:
   Profile: http://localhost:3000/profesionales/kDEkmtkaW6cuBP42Q5K9qHX7grH2
   Booking: http://localhost:3000/reservar?professional=kDEkmtkaW6cuBP42Q5K9qHX7grH2

✨ Done!
```

#### Datos Creados

El script crea un profesional con:

- **Información Personal:**
  - Nombre: María González
  - Título: Lic.
  - Email: maria.gonzalez@test.com

- **Información Profesional:**
  - Especialidad: Psicología Clínica
  - Categoría: Salud Mental
  - Biografía completa
  - Imagen de perfil (Unsplash)

- **Configuración de Sesiones:**
  - Precio: $45,000
  - Duración: 50 minutos
  - Buffer: 10 minutos

- **Disponibilidad:**
  - Lunes a Viernes: 9:00-13:00 y 14:00-17:00
  - Sábado y Domingo: No disponible

- **Estado:**
  - Pre-aprobado para testing

#### Personalización

Para modificar los datos del profesional de prueba, editar el objeto `professionalData` en el script:

```javascript
const professionalData = {
  firstName: 'Tu Nombre',
  lastName: 'Tu Apellido',
  // ... otros campos
};
```

---

### 2. `approve-professional.js`

Aprueba un profesional específico directamente en Firestore (útil para desarrollo).

#### Uso

```bash
node scripts/approve-professional.js <professional-id>
```

#### Ejemplo

```bash
node scripts/approve-professional.js kDEkmtkaW6cuBP42Q5K9qHX7grH2
```

#### Output

```
✅ Professional kDEkmtkaW6cuBP42Q5K9qHX7grH2 approved successfully!
```

---

## 🔧 Troubleshooting

### Error: "Cannot find module 'firebase-admin'"

**Solución:**
```bash
npm install firebase-admin
```

### Error: "ENOENT: no such file or directory, open 'serviceAccountKey.json'"

**Solución:**
1. Descargar el Service Account Key desde Firebase Console
2. Guardar como `serviceAccountKey.json` en la raíz del proyecto
3. Asegurarse de que el archivo esté en `.gitignore`

### Error: "Permission denied"

**Solución:**
Verificar que el Service Account tenga permisos de escritura en Firestore:
1. Firebase Console > IAM & Admin
2. Verificar que el service account tenga rol "Firebase Admin SDK Administrator Service Agent"

---

## 🔐 Seguridad

**IMPORTANTE:** 
- Nunca commitear `serviceAccountKey.json` al repositorio
- Agregar `serviceAccountKey.json` a `.gitignore`
- Rotar las keys periódicamente
- Usar diferentes service accounts para desarrollo y producción

---

## 📝 Notas

- Estos scripts son solo para desarrollo y testing
- No usar en producción
- Los datos creados son ficticios
- Limpiar datos de prueba regularmente

---

## 🚀 Próximos Scripts

Scripts planeados para futuras versiones:

- `create-test-appointments.js` - Crear turnos de prueba
- `seed-database.js` - Poblar base de datos con datos de prueba
- `cleanup-test-data.js` - Limpiar datos de prueba
- `migrate-data.js` - Migrar datos entre entornos

---

**Última actualización:** 2026-02-15
