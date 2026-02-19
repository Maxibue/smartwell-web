import { Resend } from 'resend';

const resend = new Resend('re_bevHP4sr_4gpTw1tpkFmhiBoLcqWCkwiw');
const TO = 'maxi.bue@gmail.com';
const FROM = 'SmartWell <noreply@smartwellapp.com>';
const APP_URL = 'https://smartwellapp.com';

function formatDateES(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

const baseStyles = `
  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f3f4f6; }
  .wrapper { padding: 40px 20px; }
  .container { max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .content { background: #ffffff; padding: 32px; }
  .details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
  .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
  .row:last-child { border-bottom: none; }
  .label { font-weight: 600; color: #6b7280; font-size: 14px; }
  .value { color: #111827; font-weight: 500; font-size: 14px; text-align: right; }
  .btn { display: inline-block; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; margin: 8px 0; }
  .footer { background: #f9fafb; padding: 24px; text-align: center; color: #9ca3af; font-size: 13px; border-top: 1px solid #e5e7eb; }
  .footer strong { color: #6b7280; }
`;

const patientName = 'Maximiliano Valdivia';
const patientEmail = TO;
const professionalName = 'Lic. María González';
const date = '2026-02-25';
const time = '15:00';
const duration = 50;
const reason = 'Me surgió un imprevisto familiar';

// ── EMAIL 5: Paciente cancela → avisa al profesional ─────────────────────────
async function sendEmail5() {
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: TO,
    subject: '[5] ❌ Un paciente canceló su turno | SmartWell',
    html: `
      <!DOCTYPE html><html>
        <head><meta charset="utf-8"><style>${baseStyles}</style></head>
        <body><div class="wrapper"><div class="container">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 36px; text-align: center;">
            <div style="font-size: 52px; margin-bottom: 12px;">❌</div>
            <h1 style="color: white; margin: 0 0 8px 0; font-size: 24px;">Turno Cancelado por el Paciente</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 0; font-size: 15px;">Un paciente canceló su sesión</p>
          </div>
          <div class="content">
            <p>Hola <strong>${professionalName}</strong>,</p>
            <p><strong>${patientName}</strong> ha cancelado el siguiente turno:</p>
            <div class="details">
              <h3 style="margin: 0 0 16px 0; color: #dc2626; font-size: 15px; text-transform: uppercase; letter-spacing: 0.05em;">Turno Cancelado</h3>
              <div class="row"><span class="label">📅 Fecha</span><span class="value">${formatDateES(date)}</span></div>
              <div class="row"><span class="label">🕐 Hora</span><span class="value">${time} hs</span></div>
              <div class="row"><span class="label">⏱️ Duración</span><span class="value">${duration} minutos</span></div>
              <div class="row"><span class="label">👤 Paciente</span><span class="value">${patientName}</span></div>
              <div class="row"><span class="label">📧 Email</span><span class="value">${patientEmail}</span></div>
              <div class="row"><span class="label">💬 Motivo</span><span class="value" style="max-width:300px; text-align:right;">${reason}</span></div>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Ese horario quedó liberado en tu agenda automáticamente.</p>
            <center><a href="${APP_URL}/panel-profesional" class="btn" style="background: #6366f1; color: white;">Ver Mi Panel</a></center>
          </div>
          <div class="footer"><strong>SmartWell</strong> · Bienestar Profesional</div>
        </div></div></div></body>
      </html>`,
  });
  if (error) console.error('❌ Email 5 error:', error);
  else console.log('✅ Email 5 enviado (Paciente cancela → professonal) - ID:', data.id);
}

// ── EMAIL 6: Paciente reagenda → avisa al profesional ────────────────────────
async function sendEmail6() {
  const oldDate = '2026-02-25';
  const oldTime = '15:00';
  const newDate = '2026-03-04';
  const newTime = '10:30';

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: TO,
    subject: '[6] 🔄 Un paciente reprogramó su turno | SmartWell',
    html: `
      <!DOCTYPE html><html>
        <head><meta charset="utf-8"><style>${baseStyles}</style></head>
        <body><div class="wrapper"><div class="container">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 36px; text-align: center;">
            <div style="font-size: 52px; margin-bottom: 12px;">🔄</div>
            <h1 style="color: white; margin: 0 0 8px 0; font-size: 24px;">Turno Reprogramado</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 0; font-size: 15px;">Un paciente cambió la fecha/hora de su sesión</p>
          </div>
          <div class="content">
            <p>Hola <strong>${professionalName}</strong>,</p>
            <p><strong>${patientName}</strong> ha reprogramado su turno. Revisá los nuevos detalles a continuación:</p>

            <div style="display: flex; gap: 16px; margin: 20px 0; flex-wrap: wrap;">
              <div style="flex: 1; min-width: 200px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px;">
                <p style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #dc2626; font-weight: 700;">❌ Turno Anterior</p>
                <p style="margin: 4px 0; font-size: 14px; color: #991b1b;"><strong>${formatDateES(oldDate)}</strong></p>
                <p style="margin: 4px 0; font-size: 14px; color: #991b1b;">${oldTime} hs · ${duration} min</p>
              </div>
              <div style="flex: 1; min-width: 200px; background: #f0fdf4; border: 2px solid #86efac; border-radius: 8px; padding: 16px;">
                <p style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #16a34a; font-weight: 700;">✅ Nuevo Turno</p>
                <p style="margin: 4px 0; font-size: 14px; color: #166534;"><strong>${formatDateES(newDate)}</strong></p>
                <p style="margin: 4px 0; font-size: 14px; color: #166534;">${newTime} hs · ${duration} min</p>
              </div>
            </div>

            <div class="details">
              <h3 style="margin: 0 0 16px 0; color: #6366f1; font-size: 15px; text-transform: uppercase; letter-spacing: 0.05em;">Datos del Paciente</h3>
              <div class="row"><span class="label">👤 Paciente</span><span class="value">${patientName}</span></div>
              <div class="row"><span class="label">📧 Email</span><span class="value">${patientEmail}</span></div>
            </div>

            <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #92400e;">⚠️ <strong>Nota:</strong> El turno quedó en estado <strong>Pendiente</strong> hasta que lo confirmes desde tu panel.</p>
            </div>
            <center><a href="${APP_URL}/panel-profesional" class="btn" style="background: #6366f1; color: white;">Confirmar Nuevo Turno →</a></center>
          </div>
          <div class="footer"><strong>SmartWell</strong> · Bienestar Profesional</div>
        </div></div></div></body>
      </html>`,
  });
  if (error) console.error('❌ Email 6 error:', error);
  else console.log('✅ Email 6 enviado (Paciente reagenda → profesional) - ID:', data.id);
}

console.log('📧 Enviando los 2 nuevos tipos de emails...\n');
await sendEmail5();
await new Promise(r => setTimeout(r, 1000));
await sendEmail6();
console.log('\n✅ ¡Listo! Revisá tu bandeja de entrada en maxi.bue@gmail.com');
