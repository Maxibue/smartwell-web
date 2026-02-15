# 🌐 Configuración DNS en Hostinger para smartwellapp.com

## 📋 Resumen

Para que tu dominio `smartwellapp.com` apunte a tu aplicación en Vercel, necesitas agregar 2 registros DNS en tu cuenta de Hostinger.

---

## ✅ Estado Actual en Vercel

- ✅ **smartwellapp.com**: Agregado (⚠️ Esperando configuración DNS)
- ✅ **www.smartwellapp.com**: Agregado (⚠️ Esperando configuración DNS)
- ✅ **smartwell-web.vercel.app**: Activo y funcionando ✅

---

## 🔧 Registros DNS a Configurar

### **1. Registro A para el dominio principal**

Este registro hace que `smartwellapp.com` (sin www) apunte a Vercel.

| Campo | Valor |
|-------|-------|
| **Tipo** | `A` |
| **Nombre/Host** | `@` (o déjalo vacío) |
| **Valor/Apunta a** | `216.198.79.1` |
| **TTL** | `14400` (o el valor por defecto) |

### **2. Registro CNAME para www**

Este registro hace que `www.smartwellapp.com` apunte a Vercel.

| Campo | Valor |
|-------|-------|
| **Tipo** | `CNAME` |
| **Nombre/Host** | `www` |
| **Valor/Apunta a** | `87c2ec13e9dd3ee1.vercel-dns-017.com.` |
| **TTL** | `14400` (o el valor por defecto) |

⚠️ **IMPORTANTE:** Asegúrate de incluir el punto (`.`) al final del valor CNAME: `87c2ec13e9dd3ee1.vercel-dns-017.com.`

---

## 📝 Instrucciones Paso a Paso en Hostinger

### **Paso 1: Acceder a la Configuración DNS**

1. Inicia sesión en tu cuenta de **Hostinger**: https://hpanel.hostinger.com
2. Ve a la sección **"Dominios"**
3. Haz clic en **"Administrar"** junto a `smartwellapp.com`
4. Busca la opción **"DNS / Servidores de nombres"** o **"Zona DNS"**

### **Paso 2: Eliminar Registros Antiguos (si existen)**

Antes de agregar los nuevos registros, elimina cualquier registro A o CNAME existente que apunte a:
- Direcciones IP antiguas
- Otros servicios de hosting
- Registros de parking de dominios

⚠️ **NO ELIMINES** registros de tipo:
- `MX` (correo electrónico)
- `TXT` (verificaciones)
- `NS` (servidores de nombres)

### **Paso 3: Agregar el Registro A**

1. Haz clic en **"Agregar registro"** o **"Add Record"**
2. Selecciona tipo: **`A`**
3. En **"Nombre"** o **"Host"**: escribe `@` (o déjalo vacío)
4. En **"Valor"** o **"Points to"**: escribe `216.198.79.1`
5. TTL: deja el valor por defecto (usualmente 14400)
6. Haz clic en **"Guardar"** o **"Add Record"**

### **Paso 4: Agregar el Registro CNAME**

1. Haz clic en **"Agregar registro"** o **"Add Record"** nuevamente
2. Selecciona tipo: **`CNAME`**
3. En **"Nombre"** o **"Host"**: escribe `www`
4. En **"Valor"** o **"Points to"**: escribe `87c2ec13e9dd3ee1.vercel-dns-017.com.`
   - ⚠️ **Incluye el punto final**: `.com.`
5. TTL: deja el valor por defecto
6. Haz clic en **"Guardar"** o **"Add Record"**

### **Paso 5: Verificar la Configuración**

Después de guardar ambos registros, deberías ver algo como esto en tu panel de DNS:

```
Tipo    Nombre    Valor                                      TTL
A       @         216.198.79.1                               14400
CNAME   www       87c2ec13e9dd3ee1.vercel-dns-017.com.      14400
```

---

## ⏱️ Tiempo de Propagación

- **Tiempo estimado:** 5 minutos a 48 horas
- **Típicamente:** 15-30 minutos
- **Factores:** Depende de tu proveedor DNS y la caché de internet

### Verificar la Propagación

Puedes verificar si los cambios se propagaron usando:
- https://dnschecker.org
- Ingresa `smartwellapp.com` y verifica que apunte a `216.198.79.1`

---

## ✅ Verificación en Vercel

Una vez que configures los DNS en Hostinger:

1. Ve a Vercel → Settings → Domains
2. Haz clic en **"Refresh"** junto a cada dominio
3. Espera a que el estado cambie de **"Invalid Configuration"** (rojo) a **"Valid Configuration"** (verde ✅)

Cuando ambos dominios muestren ✅, tu sitio estará accesible en:
- https://smartwellapp.com
- https://www.smartwellapp.com

---

## 🔒 Certificado SSL

Vercel configurará automáticamente un certificado SSL gratuito (HTTPS) una vez que los DNS estén correctamente configurados. Esto puede tomar unos minutos adicionales.

---

## ❓ Solución de Problemas

### El dominio no se verifica después de 24 horas

1. Verifica que los registros DNS estén exactamente como se indica arriba
2. Asegúrate de que no haya registros duplicados o conflictivos
3. Verifica que el punto final (`.`) esté incluido en el CNAME
4. Contacta al soporte de Hostinger si persiste el problema

### Error "Invalid Configuration"

- Verifica que la IP sea exactamente: `216.198.79.1`
- Verifica que el CNAME sea exactamente: `87c2ec13e9dd3ee1.vercel-dns-017.com.`
- Haz clic en "Refresh" en Vercel después de hacer cambios

### El sitio muestra "404" o "Not Found"

- Espera a que el certificado SSL se genere (puede tomar hasta 1 hora)
- Verifica que el deployment en Vercel esté en estado "Ready"
- Limpia la caché de tu navegador (Ctrl+Shift+R o Cmd+Shift+R)

---

## 📞 Soporte

- **Vercel Docs:** https://vercel.com/docs/concepts/projects/domains
- **Hostinger Support:** https://www.hostinger.com/contact

---

## 🎯 Próximos Pasos

Después de configurar el DNS:

1. ✅ Esperar a que los DNS se propaguen
2. ✅ Verificar que Vercel muestre "Valid Configuration"
3. ✅ Configurar dominios autorizados en Firebase Console
4. ✅ Probar la aplicación en el dominio personalizado
5. ✅ Verificar que todas las funcionalidades funcionen correctamente

---

**¡Buena suerte con la configuración! 🚀**
