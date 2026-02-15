# 🔑 Configuración de Firebase Admin Credentials

## ¿Por qué necesitamos esto?

Firebase Admin SDK permite verificar tokens de autenticación en el **servidor** (API routes), lo cual es necesario para proteger endpoints como el de envío de emails.

---

## 📋 Pasos para Obtener las Credenciales

### 1. Ir a Firebase Console

1. Abre Firebase Console: https://console.firebase.google.com/project/smartwell-v2/settings/serviceaccounts/adminsdk
2. Asegúrate de estar en el proyecto **smartwell-v2**
3. Ve a **Project Settings** (⚙️ icono de engranaje)
4. Selecciona la pestaña **Service accounts**

### 2. Generar Nueva Clave Privada

1. En la sección **Firebase Admin SDK**, haz clic en **"Generate new private key"**
2. Confirma haciendo clic en **"Generate key"**
3. Se descargará un archivo JSON (ejemplo: `smartwell-v2-firebase-adminsdk-xxxxx.json`)

⚠️ **IMPORTANTE:** Este archivo contiene credenciales sensibles. NO lo compartas ni lo subas a Git.

### 3. Extraer las Credenciales

Abre el archivo JSON descargado. Verás algo como:

```json
{
  "type": "service_account",
  "project_id": "smartwell-v2",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@smartwell-v2.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

Necesitas extraer:
- `client_email`
- `private_key`

---

## 🔧 Configurar en Vercel

### Opción 1: Variables Individuales (RECOMENDADO)

1. Ve a Vercel Dashboard: https://vercel.com/maxibue-4045s-projects/smartwell-web/settings/environment-variables
2. Agrega las siguientes variables:

#### Variable 1: FIREBASE_CLIENT_EMAIL
- **Key:** `FIREBASE_CLIENT_EMAIL`
- **Value:** `firebase-adminsdk-xxxxx@smartwell-v2.iam.gserviceaccount.com`
- **Environment:** Production, Preview, Development

#### Variable 2: FIREBASE_PRIVATE_KEY
- **Key:** `FIREBASE_PRIVATE_KEY`
- **Value:** (copia el valor completo de `private_key` del JSON)
  ```
  -----BEGIN PRIVATE KEY-----
  MIIEvQIBADANBg...
  -----END PRIVATE KEY-----
  ```
- **Environment:** Production, Preview, Development

⚠️ **IMPORTANTE:** 
- Copia el valor EXACTO incluyendo `-----BEGIN PRIVATE KEY-----` y `-----END PRIVATE KEY-----`
- Vercel automáticamente escapará los saltos de línea (`\n`)
- NO agregues comillas extras

### Opción 2: JSON Completo (Alternativa)

Si prefieres usar el JSON completo:

1. **Key:** `FIREBASE_SERVICE_ACCOUNT`
2. **Value:** (pega todo el contenido del archivo JSON en una sola línea)
3. **Environment:** Production, Preview, Development

---

## 💻 Configurar Localmente (Desarrollo)

### Opción 1: Variables de Entorno

Crea o edita `.env.local`:

```bash
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@smartwell-v2.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n"
```

### Opción 2: Application Default Credentials (ADC)

Si tienes Firebase CLI instalado y autenticado:

```bash
firebase login
```

El código automáticamente usará tus credenciales locales.

---

## ✅ Verificar Configuración

### En Vercel

1. Ve a Settings → Environment Variables
2. Verifica que veas:
   - ✅ `FIREBASE_CLIENT_EMAIL`
   - ✅ `FIREBASE_PRIVATE_KEY`

### Localmente

Ejecuta el servidor de desarrollo:

```bash
npm run dev
```

Si ves este warning, está OK (usará ADC):
```
No Firebase Admin credentials found. Using Application Default Credentials.
```

Si ves errores de credenciales inválidas, revisa que:
- El `private_key` esté completo
- Los saltos de línea estén correctos (`\n`)
- El `client_email` sea correcto

---

## 🔒 Seguridad

### ✅ Buenas Prácticas

- ✅ Nunca subas el archivo JSON a Git
- ✅ Usa variables de entorno en Vercel
- ✅ Rota las claves cada 6-12 meses
- ✅ Usa diferentes Service Accounts para dev/prod (opcional)

### ❌ NO Hacer

- ❌ NO compartas el archivo JSON
- ❌ NO subas credenciales a repositorios públicos
- ❌ NO uses las mismas credenciales en múltiples proyectos

---

## 🧪 Probar que Funciona

Después de configurar las variables en Vercel:

1. Haz un nuevo deployment (push a GitHub)
2. Espera que el build complete exitosamente
3. Prueba reservar un turno en la aplicación
4. Verifica que se envíen los emails de confirmación

Si todo funciona:
- ✅ El deployment será exitoso
- ✅ Los emails se enviarán correctamente
- ✅ No verás errores de autenticación

---

## 🆘 Troubleshooting

### Error: "Service account object must contain a string 'private_key' property"

**Causa:** La variable `FIREBASE_PRIVATE_KEY` no está configurada o está mal formateada.

**Solución:**
1. Verifica que la variable esté en Vercel
2. Verifica que incluya `-----BEGIN PRIVATE KEY-----` y `-----END PRIVATE KEY-----`
3. Verifica que no haya espacios extras al inicio/final

### Error: "Invalid token"

**Causa:** El token JWT del cliente no es válido o expiró.

**Solución:**
1. Verifica que el usuario esté autenticado
2. Intenta hacer logout y login nuevamente
3. Verifica que las claves de Firebase Client sean correctas

### Build falla en Vercel

**Causa:** Firebase Admin intenta inicializarse durante el build.

**Solución:**
- ✅ Ya está corregido con lazy loading
- El código solo inicializa Firebase Admin cuando se usa

---

## 📚 Referencias

- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Service Account Keys](https://cloud.google.com/iam/docs/creating-managing-service-account-keys)

---

**Última actualización:** 15 de febrero de 2026
