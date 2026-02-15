# 🚀 Guía de Despliegue - SmartWell

## Arquitectura Recomendada

```
smartwellapp.com → Vercel (Next.js) → Firebase (Backend)
```

---

## Paso 1: Deploy en Vercel

### 1.1 Crear cuenta en Vercel
1. Ve a https://vercel.com
2. Sign up con GitHub
3. Autoriza acceso a tu repositorio

### 1.2 Importar proyecto
```bash
# Opción A: Desde la web de Vercel
1. Click en "Add New Project"
2. Importa tu repositorio de GitHub
3. Vercel detecta Next.js automáticamente
4. Click "Deploy"

# Opción B: Desde CLI
npm i -g vercel
vercel login
vercel
```

### 1.3 Configurar variables de entorno
En el dashboard de Vercel:
1. Settings → Environment Variables
2. Agregar todas las variables de `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
```

### 1.4 Deploy
- Vercel hace deploy automático
- URL temporal: `smartwell-web.vercel.app`

---

## Paso 2: Configurar Dominio Personalizado

### 2.1 En Vercel
1. Settings → Domains
2. Agregar `smartwellapp.com`
3. Vercel te dará registros DNS

### 2.2 En Hostinger
1. Panel de Control → DNS Zone Editor
2. Agregar registros que Vercel te dio:

```
Tipo: A
Host: @
Value: 76.76.21.21

Tipo: CNAME
Host: www
Value: cname.vercel-dns.com
```

3. Guardar cambios
4. Esperar propagación (5-30 minutos)

### 2.3 Verificar
- Vercel detecta automáticamente
- HTTPS se configura solo
- ✅ `https://smartwellapp.com` funcionando

---

## Paso 3: Configurar Firebase

### 3.1 Actualizar dominios autorizados
Firebase Console → Authentication → Settings → Authorized domains:
```
smartwellapp.com
www.smartwellapp.com
smartwell-web.vercel.app
```

### 3.2 Actualizar CORS (si usas Storage)
```bash
gsutil cors set cors.json gs://your-bucket-name
```

Archivo `cors.json`:
```json
[
  {
    "origin": ["https://smartwellapp.com", "https://www.smartwellapp.com"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "maxAgeSeconds": 3600
  }
]
```

---

## Paso 4: Optimizaciones

### 4.1 Configurar `vercel.json`
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### 4.2 Configurar `next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['firebasestorage.googleapis.com'],
    formats: ['image/avif', 'image/webp'],
  },
  // Optimizaciones de producción
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

---

## Paso 5: CI/CD Automático

### 5.1 Configurar GitHub Actions (Opcional)
Vercel ya hace deploy automático, pero puedes agregar tests:

`.github/workflows/ci.yml`:
```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run build
```

---

## Paso 6: Monitoreo

### 6.1 Vercel Analytics
1. Dashboard → Analytics
2. Habilitar Web Analytics
3. Ver métricas en tiempo real

### 6.2 Firebase Performance
```typescript
// src/lib/firebase.ts
import { getPerformance } from 'firebase/performance';

if (typeof window !== 'undefined') {
  const perf = getPerformance(app);
}
```

---

## Comandos Útiles

### Deploy manual
```bash
vercel --prod
```

### Ver logs
```bash
vercel logs smartwellapp.com
```

### Rollback
```bash
vercel rollback
```

### Alias
```bash
vercel alias set deployment-url.vercel.app smartwellapp.com
```

---

## Checklist de Deploy

### Pre-Deploy
- [ ] Variables de entorno configuradas
- [ ] Build local exitoso (`npm run build`)
- [ ] Tests pasando
- [ ] Firestore rules desplegadas
- [ ] Firestore indexes creados

### Deploy
- [ ] Proyecto importado en Vercel
- [ ] Variables de entorno en Vercel
- [ ] Deploy exitoso
- [ ] URL temporal funcionando

### Post-Deploy
- [ ] Dominio personalizado configurado
- [ ] DNS propagado
- [ ] HTTPS funcionando
- [ ] Firebase dominios autorizados
- [ ] Analytics habilitado
- [ ] Performance monitoring activo

---

## Troubleshooting

### Build falla
```bash
# Limpiar cache
rm -rf .next node_modules
npm install
npm run build
```

### Variables de entorno no funcionan
- Verificar que empiecen con `NEXT_PUBLIC_`
- Redeploy después de agregar variables
- Verificar en Vercel Dashboard

### Dominio no resuelve
- Verificar DNS con `dig smartwellapp.com`
- Esperar propagación (hasta 48h)
- Verificar registros en Hostinger

### Firebase auth falla
- Verificar dominios autorizados en Firebase Console
- Verificar CORS si usas Storage
- Verificar API keys en variables de entorno

---

## Costos Estimados

### Vercel
- **Hobby (Gratis)**: 100GB bandwidth, unlimited deployments
- **Pro ($20/mes)**: 1TB bandwidth, analytics, team features

### Firebase
- **Spark (Gratis)**: 10GB storage, 50K reads/día
- **Blaze (Pay as you go)**: ~$25-50/mes para app mediana

### Hostinger
- **Solo DNS**: Gratis (ya tienes el dominio)

**Total estimado**: $0-20/mes para empezar

---

## Próximos Pasos

1. ✅ Deploy en Vercel
2. ✅ Configurar dominio
3. ✅ Monitoreo activo
4. 🔄 Configurar staging environment
5. 🔄 Configurar backups automáticos
6. 🔄 Implementar error tracking (Sentry)

---

## Recursos

- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)
- [Custom Domain Setup](https://vercel.com/docs/concepts/projects/domains)
