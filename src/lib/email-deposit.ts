/**
 * Deposit-related email notifications for SmartWell
 * Handles the MP alias payment flow (seña)
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'SmartWell <noreply@smartwellapp.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://smartwellapp.com';

function formatDateES(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

const baseStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; }
  .wrapper { padding: 24px 16px; }
  .container { max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .content { padding: 32px 36px; }
  .content p { color: #374151; font-size: 15px; line-height: 1.6; margin-bottom: 16px; }
  .details { background: #f9fafb; border-radius: 12px; padding: 20px; margin: 24px 0; }
  .row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
  .row:last-child { border-bottom: none; }
  .label { font-size: 13px; color: #6b7280; font-weight: 500; }
  .value { font-size: 14px; color: #111827; font-weight: 600; }
  .btn { display: inline-block; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; margin: 8px 0; }
  .footer { background: #f9fafb; padding: 20px 36px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
`;

// ── 1. Instrucciones de seña al paciente ──────────────────────────────────────
export interface DepositInstructionsData {
  patientName: string;
  patientEmail: string;
  professionalName: string;
  date: string;
  time: string;
  duration: number;
  sessionPrice: number;
  depositPercent: number;
  mpAlias: string;
  appointmentId: string;
}

export async function sendDepositInstructionsToPatient(data: DepositInstructionsData) {
  const {
    patientName, patientEmail, professionalName,
    date, time, duration, sessionPrice, depositPercent, mpAlias, appointmentId,
  } = data;

  const depositAmount = Math.round(sessionPrice * depositPercent / 100);
  const uploadUrl = `${APP_URL}/reservar/pago/${appointmentId}`;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: patientEmail,
    subject: '💳 Instrucciones de Seña para tu Turno - SmartWell',
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>${baseStyles}</style></head>
<body><div class="wrapper"><div class="container">
  <div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:36px;text-align:center;">
    <div style="font-size:52px;margin-bottom:12px;">💳</div>
    <h1 style="color:white;margin:0 0 8px 0;font-size:24px;">¡Reserva Recibida!</h1>
    <p style="color:rgba(255,255,255,0.85);margin:0;font-size:15px;">Completá el pago de la seña para confirmar tu turno</p>
  </div>
  <div class="content">
    <p>Hola <strong>${patientName}</strong>,</p>
    <p>Tu solicitud de turno con <strong>${professionalName}</strong> fue recibida. Para confirmarla, necesitás abonar la seña a continuación.</p>
    <div class="details">
      <div class="row"><span class="label">📅 Fecha</span><span class="value">${formatDateES(date)}</span></div>
      <div class="row"><span class="label">🕐 Hora</span><span class="value">${time} hs</span></div>
      <div class="row"><span class="label">⏱️ Duración</span><span class="value">${duration} minutos</span></div>
      <div class="row"><span class="label">👤 Profesional</span><span class="value">${professionalName}</span></div>
      <div class="row"><span class="label">💰 Precio total sesión</span><span class="value">$${sessionPrice.toLocaleString('es-AR')}</span></div>
    </div>
    <div style="background:#ecfdf5;border:2px solid #10b981;border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
      <p style="margin:0 0 4px 0;font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Monto a abonar (${depositPercent}% de seña)</p>
      <p style="margin:0 0 16px 0;font-size:40px;font-weight:800;color:#059669;">$${depositAmount.toLocaleString('es-AR')}</p>
      <p style="margin:0 0 6px 0;font-size:13px;color:#6b7280;font-weight:600;">Alias / CVU de MercadoPago</p>
      <div style="background:white;border:2px dashed #10b981;border-radius:8px;padding:12px 24px;display:inline-block;margin:4px 0 12px;">
        <p style="margin:0;font-size:22px;font-weight:800;color:#065f46;letter-spacing:0.05em;">${mpAlias}</p>
      </div>
      <p style="margin:0;font-size:12px;color:#9ca3af;">Podés usar la app de MercadoPago o cualquier home banking</p>
    </div>
    <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="margin:0;font-size:14px;color:#92400e;line-height:1.7;">
        📌 <strong>Paso a paso:</strong><br>
        1. Transferí <strong>$${depositAmount.toLocaleString('es-AR')}</strong> al alias <strong>${mpAlias}</strong><br>
        2. Guardá el comprobante de la transferencia<br>
        3. Subí el comprobante haciendo clic en el botón de abajo
      </p>
    </div>
    <center><a href="${uploadUrl}" class="btn" style="background:#10b981;color:white;font-size:16px;">Subir Comprobante de Pago →</a></center>
    <p style="font-size:13px;color:#9ca3af;text-align:center;margin-top:16px;">También podés acceder desde tu panel en "Mis Turnos"</p>
  </div>
  <div class="footer">
    <strong>SmartWell</strong> · Bienestar Profesional<br>
    <span>Tu turno se confirmará una vez que el profesional verifique el pago.</span>
  </div>
</div></div></div></body>
</html>`,
  });

  if (error) {
    console.error('❌ Error sending deposit instructions:', error);
    throw new Error(error.message);
  }
  console.log('✅ Deposit instructions sent to patient:', patientEmail);
}

// ── 2. Comprobante rechazado por el profesional → avisa al paciente ────────────
export interface PaymentRejectedData {
  patientName: string;
  patientEmail: string;
  professionalName: string;
  date: string;
  time: string;
  appointmentId: string;
  isSecondRejection?: boolean;
  rejectionReason?: string;
}

export async function sendPaymentRejectedToPatient(data: PaymentRejectedData) {
  const {
    patientName, patientEmail, professionalName,
    date, time, appointmentId, isSecondRejection, rejectionReason,
  } = data;

  const uploadUrl = `${APP_URL}/reservar/pago/${appointmentId}`;
  const color = isSecondRejection ? '#ef4444' : '#f59e0b';
  const emoji = isSecondRejection ? '❌' : '⚠️';
  const title = isSecondRejection ? 'Reserva Cancelada' : 'Comprobante Rechazado';
  const subject = isSecondRejection
    ? '❌ Tu reserva fue cancelada - SmartWell'
    : '⚠️ Comprobante rechazado - Reintentá el pago - SmartWell';

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: patientEmail,
    subject,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>${baseStyles}</style></head>
<body><div class="wrapper"><div class="container">
  <div style="background:${color};padding:36px;text-align:center;">
    <div style="font-size:52px;margin-bottom:12px;">${emoji}</div>
    <h1 style="color:white;margin:0 0 8px 0;font-size:24px;">${title}</h1>
    <p style="color:rgba(255,255,255,0.85);margin:0;font-size:15px;">
      ${isSecondRejection ? 'No se pudo verificar el pago de la seña' : 'Hubo un problema con tu comprobante'}
    </p>
  </div>
  <div class="content">
    <p>Hola <strong>${patientName}</strong>,</p>
    ${isSecondRejection
        ? `<p><strong>${professionalName}</strong> no pudo verificar el pago de la seña por segunda vez. Tu reserva fue <strong>cancelada automáticamente</strong>. Si querés intentarlo de nuevo, realizá una nueva reserva.</p>`
        : `<p><strong>${professionalName}</strong> revisó tu comprobante pero no pudo verificarlo. Tenés <strong>un intento más</strong> para subir el comprobante correcto antes de que el turno se cancele.</p>`
      }
    ${rejectionReason
        ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px;margin:16px 0;">
           <p style="margin:0;font-size:14px;color:#991b1b;">💬 <strong>Motivo:</strong> ${rejectionReason}</p>
         </div>`
        : ''
      }
    <div class="details">
      <div class="row"><span class="label">📅 Fecha</span><span class="value">${formatDateES(date)}</span></div>
      <div class="row"><span class="label">🕐 Hora</span><span class="value">${time} hs</span></div>
      <div class="row"><span class="label">👤 Profesional</span><span class="value">${professionalName}</span></div>
    </div>
    ${!isSecondRejection
        ? `<center><a href="${uploadUrl}" class="btn" style="background:#f59e0b;color:white;">Reintentar — Subir nuevo comprobante →</a></center>`
        : ''
      }
  </div>
  <div class="footer"><strong>SmartWell</strong> · Bienestar Profesional</div>
</div></div></div></body>
</html>`,
  });

  if (error) {
    console.error('❌ Error sending payment rejected email:', error);
    throw new Error(error.message);
  }
  console.log('✅ Payment rejected email sent to patient:', patientEmail);
}

// ── 3. Pago aprobado por el profesional → turno confirmado ────────────────────
export interface PaymentApprovedData {
  patientName: string;
  patientEmail: string;
  professionalName: string;
  date: string;
  time: string;
  duration: number;
  sessionPrice: number;
  meetingLink?: string;
}

export async function sendPaymentApprovedToPatient(data: PaymentApprovedData) {
  const { patientName, patientEmail, professionalName, date, time, duration, sessionPrice, meetingLink } = data;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: patientEmail,
    subject: '🎉 ¡Pago verificado! Tu turno está confirmado - SmartWell',
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>${baseStyles}</style></head>
<body><div class="wrapper"><div class="container">
  <div style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:36px;text-align:center;">
    <div style="font-size:52px;margin-bottom:12px;">🎉</div>
    <h1 style="color:white;margin:0 0 8px 0;font-size:24px;">¡Turno Confirmado!</h1>
    <p style="color:rgba(255,255,255,0.85);margin:0;font-size:15px;">Tu pago fue verificado · Todo listo para tu sesión</p>
  </div>
  <div class="content">
    <p>Hola <strong>${patientName}</strong>,</p>
    <p>¡Excelente! <strong>${professionalName}</strong> verificó tu comprobante de pago. Tu turno está <strong>100% confirmado</strong>.</p>
    <div class="details">
      <div class="row"><span class="label">📅 Fecha</span><span class="value">${formatDateES(date)}</span></div>
      <div class="row"><span class="label">🕐 Hora</span><span class="value">${time} hs</span></div>
      <div class="row"><span class="label">⏱️ Duración</span><span class="value">${duration} minutos</span></div>
      <div class="row"><span class="label">👤 Profesional</span><span class="value">${professionalName}</span></div>
      <div class="row"><span class="label">💰 Total sesión</span><span class="value">$${sessionPrice.toLocaleString('es-AR')}</span></div>
      <div class="row"><span class="label">📌 Estado</span><span class="value" style="color:#6366f1;font-weight:700;">✅ Confirmado</span></div>
    </div>
    ${meetingLink
        ? `<div style="background:#eef2ff;border:2px solid #6366f1;border-radius:12px;padding:20px;margin:24px 0;text-align:center;">
           <p style="margin:0 0 8px 0;font-weight:700;color:#4338ca;">🎥 Videollamada</p>
           <p style="margin:0 0 16px 0;font-size:13px;color:#6b7280;">Disponible 15 minutos antes de tu sesión</p>
           <a href="${meetingLink}" class="btn" style="background:#6366f1;color:white;">Acceder a la Sesión</a>
         </div>`
        : ''
      }
    <center><a href="${APP_URL}/panel-usuario/turnos" class="btn" style="background:#6366f1;color:white;">Ver Mis Turnos</a></center>
  </div>
  <div class="footer"><strong>SmartWell</strong> · Bienestar Profesional</div>
</div></div></div></body>
</html>`,
  });

  if (error) {
    console.error('❌ Error sending payment approved email:', error);
    throw new Error(error.message);
  }
  console.log('✅ Payment approved email sent to patient:', patientEmail);
}

// ── 4. Notificación al profesional: Nuevo pago subido ────────────────────────
export interface PaymentUploadedData {
  professionalEmail: string;
  professionalName: string;
  patientName: string;
  date: string;
  time: string;
  receiptUrl: string;
}

export async function sendPaymentUploadedToProfessional(data: PaymentUploadedData) {
  const { professionalEmail, professionalName, patientName, date, time, receiptUrl } = data;
  const dashboardUrl = `${APP_URL}/panel-profesional`;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: professionalEmail,
    subject: '🔔 Nuevo comprobante de pago recibido - SmartWell',
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>${baseStyles}</style></head>
<body><div class="wrapper"><div class="container">
  <div style="background:#f59e0b;padding:36px;text-align:center;">
    <div style="font-size:52px;margin-bottom:12px;">💳</div>
    <h1 style="color:white;margin:0 0 8px 0;font-size:24px;">¡Nuevo Comprobante!</h1>
    <p style="color:rgba(255,255,255,0.9);margin:0;font-size:15px;">Validá el pago para confirmar el turno</p>
  </div>
  <div class="content">
    <p>Hola <strong>${professionalName}</strong>,</p>
    <p>El paciente <strong>${patientName}</strong> subió el comprobante de pago para su turno.</p>
    <div class="details">
      <div class="row"><span class="label">📅 Fecha</span><span class="value">${formatDateES(date)}</span></div>
      <div class="row"><span class="label">🕐 Hora</span><span class="value">${time} hs</span></div>
      <div class="row"><span class="label">👤 Paciente</span><span class="value">${patientName}</span></div>
    </div>
    <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin:20px 0;text-align:center;">
      <p style="margin:0 0 8px 0;font-size:13px;color:#92400e;">⚠️ Acción requerida</p>
      <p style="margin:0;font-size:14px;color:#78350f;">Revisá el comprobante y aprobá o rechazá el turno desde tu panel.</p>
    </div>
    <center>
        <a href="${dashboardUrl}" class="btn" style="background:#f59e0b;color:white;">Ir al Panel Profesional →</a>
    </center>
  </div>
  <div class="footer"><strong>SmartWell</strong> · Panel Profesional</div>
</div></div></div></body>
</html>`,
  });

  if (error) {
    console.error('❌ Error sending payment uploaded email:', error);
    throw new Error(error.message);
  }
  console.log('✅ Payment uploaded email sent to professional:', professionalEmail);
}
