# 🚀 Guía Paso a Paso - Deploy de SmartWell en Vercel

## ✅ Pre-requisitos Completados

- [x] Proyecto compila correctamente
- [x] Variables de entorno identificadas
- [x] Configuración de Vercel lista

---

## 📋 PASO 1: Crear Cuenta en Vercel (5 minutos)

### 1.1 Ir a Vercel
1. Abre tu navegador
2. Ve a: **https://vercel.com**
3. Click en **"Sign Up"** (arriba a la derecha)

### 1.2 Registrarse con GitHub
1. Click en **"Continue with GitHub"**
2. Autoriza a Vercel para acceder a tu cuenta de GitHub
3. Si te pide permisos adicionales, acéptalos

### 1.3 Verificar cuenta
1. Vercel te enviará un email de verificación
2. Abre el email y verifica tu cuenta
3. ✅ Cuenta creada

---

## 📋 PASO 2: Conectar Repositorio (5 minutos)

### 2.1 Importar Proyecto
1. En el dashboard de Vercel, click en **"Add New..."**
2. Selecciona **"Project"**
3. Click en **"Import Git Repository"**

### 2.2 Seleccionar Repositorio
1. Busca tu repositorio: **"SmartWell - v2"** o **"smartwell-web"**
2. Click en **"Import"**

### 2.3 Configurar Proyecto
Vercel detectará automáticamente que es Next.js:
- **Framework Preset**: Next.js (detectado automáticamente)
- **Root Directory**: `smartwell-web` (si está en subcarpeta)
- **Build Command**: `npm run build` (automático)
- **Output Directory**: `.next` (automático)

**NO HAGAS DEPLOY TODAVÍA** - Primero necesitamos agregar las variables de entorno

---

## 📋 PASO 3: Configurar Variables de Entorno (10 minutos)

### 3.1 Abrir Configuración de Variables
1. En la pantalla de configuración del proyecto
2. Busca la sección **"Environment Variables"**
3. Click para expandir

### 3.2 Agregar Variables de Firebase

**IMPORTANTE**: Copia y pega EXACTAMENTE estas variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBjgm4o9Lmkvksk1hFtpFSBI377E8TzTxs
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=smartwell-v2.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=smartwell-v2
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=smartwell-v2.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1011432492788
NEXT_PUBLIC_FIREBASE_APP_ID=1:1011432492788:web:47c1d2d7ebf825e91718a1
```

### 3.3 Cómo Agregar Cada Variable

Para cada variable:
1. En **"Key"**: pega el nombre (ej: `NEXT_PUBLIC_FIREBASE_API_KEY`)
2. En **"Value"**: pega el valor (ej: `AIzaSyBjgm4o9Lmkvksk1hFtpFSBI377E8TzTxs`)
3. En **"Environment"**: selecciona **"Production", "Preview", y "Development"** (todas)
4. Click en **"Add"**

Repite para las 6 variables.

### 3.4 Verificar
- ✅ 6 variables agregadas
- ✅ Todas con los 3 ambientes seleccionados

---

## 📋 PASO 4: Deploy Inicial (5 minutos)

### 4.1 Iniciar Deploy
1. Scroll hasta abajo
2. Click en **"Deploy"**
3. Espera... (tomará 2-3 minutos)

### 4.2 Monitorear Build
Verás:
- ⏳ "Building..." - Compilando tu proyecto
- ⏳ "Deploying..." - Subiendo a CDN
- ✅ "Deployment Ready" - ¡Listo!

### 4.3 Ver tu App
1. Click en **"Visit"** o en la URL que aparece
2. Tu app estará en: `https://smartwell-web-xxx.vercel.app`
3. ✅ Verifica que funcione

---

## 📋 PASO 5: Configurar Dominio Personalizado (15 minutos)

### 5.1 En Vercel - Agregar Dominio
1. En el dashboard del proyecto, ve a **"Settings"**
2. Click en **"Domains"** en el menú lateral
3. En "Add Domain", escribe: **smartwellapp.com**
4. Click en **"Add"**

### 5.2 Copiar Registros DNS
Vercel te mostrará los registros DNS que necesitas agregar:

**Tipo A:**
```
Type: A
Name: @
Value: 76.76.21.21
```

**Tipo CNAME:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 5.3 En Hostinger - Actualizar DNS
1. Inicia sesión en **Hostinger**
2. Ve a **"Dominios"** → **"smartwellapp.com"**
3. Click en **"DNS / Nameservers"**
4. Click en **"DNS Zone Editor"**

### 5.4 Agregar Registro A
1. Click en **"Add Record"**
2. Selecciona **"A"**
3. En **"Name"**: pon **@**
4. En **"Points to"**: pon **76.76.21.21**
5. TTL: **14400** (o el valor por defecto)
6. Click en **"Add Record"**

### 5.5 Agregar Registro CNAME
1. Click en **"Add Record"**
2. Selecciona **"CNAME"**
3. En **"Name"**: pon **www**
4. En **"Points to"**: pon **cname.vercel-dns.com**
5. TTL: **14400** (o el valor por defecto)
6. Click en **"Add Record"**

### 5.6 Eliminar Registros Conflictivos (IMPORTANTE)
Si hay registros A o CNAME existentes para @ o www:
1. Elimínalos primero
2. Luego agrega los nuevos

### 5.7 Guardar Cambios
1. Click en **"Save Changes"** o **"Update"**
2. ✅ DNS actualizado

---

## 📋 PASO 6: Esperar Propagación (5-30 minutos)

### 6.1 Verificar en Vercel
1. Vuelve a Vercel → Settings → Domains
2. Verás el estado del dominio
3. Espera a que diga **"Valid Configuration"**

### 6.2 Verificar DNS (Opcional)
Abre terminal y ejecuta:
```bash
dig smartwellapp.com
```

Deberías ver la IP: `76.76.21.21`

### 6.3 Probar en Navegador
1. Ve a: **https://smartwellapp.com**
2. Si no funciona aún, espera 10-15 minutos más
3. El DNS puede tardar hasta 48h, pero usualmente es 5-30 minutos

---

## 📋 PASO 7: Configurar Firebase (10 minutos)

### 7.1 Agregar Dominios Autorizados
1. Ve a **Firebase Console**: https://console.firebase.google.com
2. Selecciona tu proyecto: **smartwell-v2**
3. Ve a **"Authentication"** → **"Settings"** → **"Authorized domains"**
4. Click en **"Add domain"**
5. Agrega:
   - `smartwellapp.com`
   - `www.smartwellapp.com`
   - `smartwell-web-xxx.vercel.app` (tu URL de Vercel)
6. Click en **"Add"**

### 7.2 Verificar
1. Intenta hacer login en tu app
2. Debería funcionar correctamente
3. ✅ Firebase configurado

---

## 📋 PASO 8: Verificación Final (5 minutos)

### 8.1 Checklist de Funcionalidades
Prueba en **https://smartwellapp.com**:

- [ ] La página carga correctamente
- [ ] Puedes navegar entre páginas
- [ ] El login funciona
- [ ] Puedes ver profesionales
- [ ] Las imágenes cargan
- [ ] No hay errores en la consola (F12)

### 8.2 Performance
1. Abre Chrome DevTools (F12)
2. Ve a **"Lighthouse"**
3. Click en **"Generate report"**
4. Deberías ver scores de 80-100

### 8.3 HTTPS
1. Verifica que la URL tenga el candado 🔒
2. Click en el candado → debería decir "Conexión segura"
3. ✅ HTTPS funcionando

---

## 🎉 ¡DEPLOY COMPLETADO!

Tu aplicación SmartWell está ahora en producción en:
- ✅ **https://smartwellapp.com**
- ✅ **https://www.smartwellapp.com**
- ✅ **https://smartwell-web-xxx.vercel.app** (backup)

---

## 🔄 Próximos Deploys (Automáticos)

Desde ahora, cada vez que hagas `git push`:
1. Vercel detecta el cambio automáticamente
2. Hace build y deploy automático
3. Tu app se actualiza en 2-3 minutos
4. ✅ Sin hacer nada manual

---

## 📊 Monitoreo

### Ver Analytics
1. Ve a tu proyecto en Vercel
2. Click en **"Analytics"**
3. Verás:
   - Visitas
   - Performance
   - Errores
   - Core Web Vitals

### Ver Logs
1. Ve a tu proyecto en Vercel
2. Click en **"Deployments"**
3. Click en cualquier deployment
4. Ve los logs de build y runtime

---

## 🆘 Troubleshooting

### El dominio no resuelve
- Espera 30 minutos más
- Verifica los registros DNS en Hostinger
- Usa `dig smartwellapp.com` para verificar

### Firebase auth no funciona
- Verifica dominios autorizados en Firebase Console
- Verifica que las variables de entorno estén correctas en Vercel

### Build falla
- Ve a Vercel → Deployments → click en el deployment fallido
- Lee los logs de error
- Contacta para ayuda

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Vercel
2. Verifica la consola del navegador (F12)
3. Contacta para ayuda con los logs

---

## ✅ Checklist Final

- [ ] Cuenta de Vercel creada
- [ ] Repositorio conectado
- [ ] Variables de entorno configuradas
- [ ] Deploy inicial exitoso
- [ ] Dominio agregado en Vercel
- [ ] DNS actualizado en Hostinger
- [ ] Dominio funcionando
- [ ] Firebase configurado
- [ ] App funcionando en smartwellapp.com
- [ ] HTTPS activo
- [ ] Todas las funcionalidades probadas

---

## 🎯 ¡Felicidades!

Tu aplicación SmartWell está ahora en producción y lista para usuarios reales! 🚀✨
