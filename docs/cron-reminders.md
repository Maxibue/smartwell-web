# Recordatorios Automáticos (Cron Job)

El endpoint `/api/cron/appointment-reminders` envía notificaciones in-app y emails
a paciente y profesional **24 horas** y **1 hora** antes de cada turno confirmado.

## Variables de entorno requeridas

```env
CRON_SECRET=tu_secreto_muy_largo_aqui   # Protege el endpoint de llamadas no autorizadas
NEXT_PUBLIC_APP_URL=https://tu-dominio.com  # Para que el cron pueda llamar /api/send-email
```

## Opciones de scheduler (todas gratis en el tier básico)

### Opción A — Vercel Cron Jobs (recomendado si usás Vercel)
Agregar en `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/appointment-reminders",
      "schedule": "*/30 * * * *"
    }
  ]
}
```
> Vercel llama automáticamente al endpoint sin necesidad de header de autenticación externo,
> pero el `CRON_SECRET` igualmente protege llamadas externas.

### Opción B — cron-job.org (gratis, sin límites)
1. Crear cuenta en https://cron-job.org
2. Nuevo cron job:
   - URL: `https://tu-dominio.com/api/cron/appointment-reminders`
   - Método: `POST`
   - Header: `x-cron-secret: <CRON_SECRET>`
   - Intervalo: cada 30 minutos

### Opción C — GitHub Actions
```yaml
# .github/workflows/reminders.yml
name: Appointment Reminders
on:
  schedule:
    - cron: '*/30 * * * *'
jobs:
  remind:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X POST https://tu-dominio.com/api/cron/appointment-reminders \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}"
```

## Cómo funciona la deduplicación

El cron marca cada appointment con:
- `reminders.sent24h: true` cuando envió el recordatorio de 24hs
- `reminders.sent1h: true` cuando envió el recordatorio de 1hs

Si el cron corre cada 30 minutos, sólo envía cada recordatorio **una vez**.
