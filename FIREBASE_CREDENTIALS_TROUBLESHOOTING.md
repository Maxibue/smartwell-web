# 🔑 GUÍA RÁPIDA: Configurar Firebase Admin en Vercel

## ⚠️ PROBLEMA ACTUAL
El archivo JSON de Firebase no se descargó correctamente desde el navegador.

## ✅ SOLUCIÓN ALTERNATIVA: Copiar Credenciales Manualmente

### PASO 1: Obtener el Client Email (Ya lo tenemos)

Desde el screenshot de Firebase Console, puedo ver que tu **client_email** es:

```
firebase-adminsdk-fbsvc@smartwell-v2.iam.gserviceaccount.com
```

### PASO 2: Generar y Descargar la Clave Privada

**Opción A: Desde Firebase Console (Recomendado)**

1. Ve a: https://console.firebase.google.com/project/smartwell-v2/settings/serviceaccounts/adminsdk
2. Haz clic en **"Generar nueva clave privada"**
3. Haz clic en **"Generar clave"** en el diálogo
4. **IMPORTANTE:** Si el archivo no se descarga automáticamente:
   - Verifica que Chrome no esté bloqueando la descarga
   - Ve a Chrome → Configuración → Privacidad y seguridad → Configuración de sitios → Descargas
   - Asegúrate de que Firebase Console tenga permiso para descargar archivos

**Opción B: Usar gcloud CLI (Alternativa)**

Si tienes gcloud instalado:

```bash
gcloud iam service-accounts keys create ~/Downloads/smartwell-v2-key.json \
  --iam-account=firebase-adminsdk-fbsvc@smartwell-v2.iam.gserviceaccount.com \
  --project=smartwell-v2
```

### PASO 3: Abrir el Archivo JSON

Una vez descargado el archivo:

```bash
# Opción 1: Abrirlo en VS Code
code ~/Downloads/smartwell-v2-*.json

# Opción 2: Ver el contenido en terminal
cat ~/Downloads/smartwell-v2-*.json | jq .

# Opción 3: Abrirlo con TextEdit
open -a TextEdit ~/Downloads/smartwell-v2-*.json
```

### PASO 4: Extraer las Credenciales

Del archivo JSON, necesitas copiar:

1. **client_email**: El valor completo del campo `"client_email"`
2. **private_key**: El valor completo del campo `"private_key"` (incluyendo `-----BEGIN` y `-----END`)

Ejemplo del archivo JSON:
```json
{
  "type": "service_account",
  "project_id": "smartwell-v2",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@smartwell-v2.iam.gserviceaccount.com",
  ...
}
```

### PASO 5: Agregar Variables en Vercel

Ve a: https://vercel.com/maxibue-4045s-projects/smartwell-web/settings/environment-variables

#### Variable 1: FIREBASE_CLIENT_EMAIL

- **Key:** `FIREBASE_CLIENT_EMAIL`
- **Value:** `firebase-adminsdk-fbsvc@smartwell-v2.iam.gserviceaccount.com`
- **Environment:** Production, Preview, Development (los 3)

#### Variable 2: FIREBASE_PRIVATE_KEY

- **Key:** `FIREBASE_PRIVATE_KEY`
- **Value:** (pega el valor completo de `private_key` del JSON)
  - Debe incluir `-----BEGIN PRIVATE KEY-----`
  - Todo el contenido del medio
  - `-----END PRIVATE KEY-----`
  - Los `\n` (saltos de línea)
- **Environment:** Production, Preview, Development (los 3)

### PASO 6: Verificar

Después de agregar las variables:
1. Vercel hará un redeploy automático
2. Espera 1-2 minutos
3. Prueba reservar un turno
4. Verifica que se envíen los emails

---

## 🆘 SI SIGUES TENIENDO PROBLEMAS

### Problema: No puedo descargar el archivo JSON

**Solución 1:** Verifica los permisos de descarga en Chrome
- Chrome → Configuración → Privacidad y seguridad
- Configuración de sitios → Descargas
- Asegúrate de que "Preguntar dónde guardar cada archivo antes de descargarlo" esté activado

**Solución 2:** Usa otro navegador
- Intenta con Safari o Firefox

**Solución 3:** Copia manualmente desde la consola del navegador
1. Abre DevTools en Chrome (F12)
2. Ve a la pestaña Network
3. Haz clic en "Generar nueva clave privada"
4. Busca la petición de descarga en Network
5. Copia la respuesta

---

## 📞 SIGUIENTE PASO

**¿Qué necesitas?**

1. ✅ Si lograste descargar el archivo → Avísame y te ayudo a extraer las credenciales
2. ❌ Si no puedes descargarlo → Puedo guiarte con gcloud CLI
3. 🤔 Si prefieres otra opción → Dime y buscamos una alternativa

---

**Última actualización:** 15 de febrero de 2026, 19:20
