# Configuración de Firebase Admin SDK en Vercel

Para que el panel de administración funcione en producción (www.smartwellapp.com), necesitas configurar las siguientes variables de entorno en Vercel.

## 📋 Variables de Entorno Requeridas

Ve a: https://vercel.com/maxibues-projects/smartwell-web/settings/environment-variables

Agrega las siguientes variables:

### 1. FIREBASE_CLIENT_EMAIL
```
firebase-adminsdk-fbsvc@smartwell-v2.iam.gserviceaccount.com
```

### 2. FIREBASE_PRIVATE_KEY_ID
```
240ff888bf65d5b06bbc0b18df0183b303c51dfc
```

### 3. FIREBASE_PRIVATE_KEY

⚠️ **IMPORTANTE:** Esta es la clave privada completa del archivo `smartwell-v2-firebase-adminsdk-fbsvc-240ff888bf.json`

Para obtenerla, ejecuta este comando en la terminal:

```bash
cat smartwell-v2-firebase-adminsdk-fbsvc-240ff888bf.json | grep -A 27 "private_key"
```

O extrae el valor del campo `"private_key"` del archivo JSON.

**Debes copiar TODO el contenido incluyendo:**
- `-----BEGIN PRIVATE KEY-----`
- Todo el contenido del medio
- `-----END PRIVATE KEY-----`

⚠️ **Asegúrate de incluir los saltos de línea** (\\n) cuando copies la clave.

## 🚀 Pasos de Configuración

1. Ve a: https://vercel.com/maxibues-projects/smartwell-web/settings/environment-variables

2. Para cada variable:
   - Click en "Add New"
   - Nombre: `FIREBASE_CLIENT_EMAIL` (ejemplo)
   - Value: Pega el valor correspondiente
   - Environments: Marca **Production**, **Preview**, y **Development**
   - Click "Save"

3. Repite para las 3 variables

4. Una vez agregadas todas, haz **Redeploy** del proyecto:
   - Ve a: https://vercel.com/maxibues-projects/smartwell-web/deployments
   - Click en el deployment más reciente
   - Click en "..." (tres puntos)
   - Click "Redeploy"

## ✅ Verificación

Una vez que Vercel termine el redeploy:

1. Ve a https://www.smartwellapp.com/panel-admin/profesionales
2. Intenta aprobar o rechazar un profesional
3. Debería funcionar correctamente

Si hay algún error, revisa los logs en Vercel:
https://vercel.com/maxibues-projects/smartwell-web/logs

## 🔒 Seguridad

- ✅ El archivo `smartwell-v2-firebase-adminsdk-*.json` está en `.gitignore`
- ✅ Las credenciales NUNCA se suben a GitHub
- ✅ Solo están en variables de entorno de Vercel (encriptadas)
- ✅ En local, el código lee del archivo JSON automáticamente

## 📝 Notas

- Las variables de entorno se leen automáticamente por el código en `src/lib/firebase-admin.ts`
- En desarrollo local, el código usa el archivo JSON
- En producción (Vercel), el código usa las variables de entorno
