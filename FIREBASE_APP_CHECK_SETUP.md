# 🔐 Configuración de Firebase App Check

## ¿Qué es Firebase App Check?

Firebase App Check protege tu backend de Firebase contra:
- Uso no autorizado de tus recursos
- Bots y scrapers
- Ataques de abuso
- Costos inesperados por uso fraudulento

## 📋 Pasos para Habilitar App Check

### 1. Habilitar App Check en Firebase Console

1. Ve a Firebase Console: https://console.firebase.google.com/project/smartwell-v2/appcheck
2. Haz clic en **"Get Started"** o **"Comenzar"**
3. Selecciona tu aplicación web
4. Elige el proveedor: **reCAPTCHA v3** (recomendado para web)

### 2. Obtener Site Key de reCAPTCHA

1. Ve a Google reCAPTCHA Admin: https://www.google.com/recaptcha/admin
2. Crea un nuevo sitio:
   - **Label:** SmartWell Web App
   - **reCAPTCHA type:** reCAPTCHA v3
   - **Domains:** 
     - `smartwellapp.com`
     - `www.smartwellapp.com`
     - `localhost` (para desarrollo)
3. Copia el **Site Key**

### 3. Configurar en Firebase Console

1. Vuelve a Firebase App Check
2. Pega el **Site Key** de reCAPTCHA
3. Haz clic en **"Save"** o **"Guardar"**
4. Habilita **enforcement** para:
   - ✅ Firestore
   - ✅ Authentication
   - ✅ Storage (si lo usas)

### 4. Agregar Variables de Entorno

Agrega a tu archivo `.env.local`:

```bash
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=tu_site_key_aqui
```

Y en Vercel:
1. Ve a Settings → Environment Variables
2. Agrega `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` con el valor del Site Key

### 5. Implementar en el Código

El código ya está preparado en `src/lib/firebase.ts`. Solo necesitas:

1. Descomentar las líneas de App Check
2. Agregar la variable de entorno
3. Hacer deploy

## ⚠️ Importante

- **NO compartas** el Secret Key de reCAPTCHA
- **Enforcement Mode:** Empieza en modo "Monitor" para probar
- **Después de probar:** Cambia a modo "Enforce" para protección total

## 🧪 Prueba

1. Abre la consola del navegador
2. Busca mensajes de App Check
3. Verifica que no haya errores
4. Prueba las funcionalidades (login, reservas, etc.)

## 📊 Monitoreo

Ve a Firebase Console → App Check → Metrics para ver:
- Requests válidos vs inválidos
- Intentos de abuso bloqueados
- Estadísticas de uso

---

**Nota:** Esta configuración es OPCIONAL pero ALTAMENTE RECOMENDADA para producción.
