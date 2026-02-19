/**
 * Email notification service for SmartWell
 * Uses Resend for professional email delivery from noreply@smartwellapp.com
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'SmartWell <noreply@smartwellapp.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://smartwellapp.com';

interface AppointmentEmailData {
  patientName: string;
  patientEmail: string;
  professionalName: string;
  professionalEmail: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  meetingLink?: string;
  patientId?: string;
  professionalId?: string;
}

/** Formatea una fecha YYYY-MM-DD en español sin desfase de zona horaria */
function formatDateES(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

/** Estilos base compartidos por todos los emails */
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

/**
 * Email al PACIENTE cuando reserva un turno (estado: pendiente de confirmación)
 */
export async function sendPatientConfirmationEmail(data: AppointmentEmailData) {
  const { patientName, patientEmail, professionalName, date, time, duration, price, meetingLink } = data;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: patientEmail,
    subject: '📅 Turno solicitado - Pendiente de confirmación | SmartWell',
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><style>${baseStyles}</style></head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 36px; text-align: center;">
                <div style="font-size: 52px; margin-bottom: 12px;">📅</div>
                <h1 style="color: white; margin: 0 0 8px 0; font-size: 24px;">¡Turno Solicitado!</h1>
                <p style="color: rgba(255,255,255,0.85); margin: 0; font-size: 15px;">Tu solicitud fue enviada al profesional</p>
              </div>
              <div class="content">
                <p>Hola <strong>${patientName}</strong>,</p>
                <p>Tu solicitud de turno con <strong>${professionalName}</strong> fue recibida exitosamente. Recibirás otro email cuando el profesional confirme la sesión.</p>

                <div class="details">
                  <h3 style="margin: 0 0 16px 0; color: #6366f1; font-size: 15px; text-transform: uppercase; letter-spacing: 0.05em;">Detalles del Turno</h3>
                  <div class="row"><span class="label">📅 Fecha</span><span class="value">${formatDateES(date)}</span></div>
                  <div class="row"><span class="label">🕐 Hora</span><span class="value">${time} hs</span></div>
                  <div class="row"><span class="label">⏱️ Duración</span><span class="value">${duration} minutos</span></div>
                  <div class="row"><span class="label">👤 Profesional</span><span class="value">${professionalName}</span></div>
                  <div class="row"><span class="label">💰 Precio</span><span class="value">$${price.toLocaleString('es-AR')}</span></div>
                  <div class="row"><span class="label">📌 Estado</span><span class="value" style="color: #f59e0b; font-weight: 700;">Pendiente de confirmación</span></div>
                </div>

                <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 14px; color: #92400e;">
                    ⏳ <strong>Próximo paso:</strong> El profesional revisará tu solicitud y recibirás un email de confirmación en breve.
                  </p>
                </div>

                <center>
                  <a href="${APP_URL}/panel-usuario/turnos" class="btn" style="background: #6366f1; color: white;">
                    Ver Mis Turnos
                  </a>
                </center>
              </div>
              <div class="footer">
                <strong>SmartWell</strong> · Bienestar Profesional<br>
                Si tenés alguna consulta, respondé este email.
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  });

  if (error) {
    console.error('❌ Error sending patient confirmation email:', error);
    throw new Error(error.message);
  }
  console.log('✅ Patient confirmation email sent to:', patientEmail);
}

/**
 * Email al PROFESIONAL cuando un paciente solicita un turno (acción requerida)
 */
export async function sendProfessionalNotificationEmail(data: AppointmentEmailData) {
  const { patientName, patientEmail, professionalName, professionalEmail, date, time, duration } = data;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: professionalEmail,
    subject: '🔔 Nueva solicitud de turno - Acción requerida | SmartWell',
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><style>${baseStyles}</style></head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 36px; text-align: center;">
                <div style="font-size: 52px; margin-bottom: 12px;">🔔</div>
                <h1 style="color: white; margin: 0 0 8px 0; font-size: 24px;">Nueva Solicitud de Turno</h1>
                <p style="color: rgba(255,255,255,0.85); margin: 0; font-size: 15px;">Un paciente quiere reservar una sesión contigo</p>
              </div>
              <div class="content">
                <p>Hola <strong>${professionalName}</strong>,</p>
                <p><strong>${patientName}</strong> ha solicitado un turno contigo y está esperando tu confirmación.</p>

                <div class="details">
                  <h3 style="margin: 0 0 16px 0; color: #d97706; font-size: 15px; text-transform: uppercase; letter-spacing: 0.05em;">Detalles de la Solicitud</h3>
                  <div class="row"><span class="label">📅 Fecha</span><span class="value">${formatDateES(date)}</span></div>
                  <div class="row"><span class="label">🕐 Hora</span><span class="value">${time} hs</span></div>
                  <div class="row"><span class="label">⏱️ Duración</span><span class="value">${duration} minutos</span></div>
                  <div class="row"><span class="label">👤 Paciente</span><span class="value">${patientName}</span></div>
                  <div class="row"><span class="label">📧 Email</span><span class="value">${patientEmail}</span></div>
                </div>

                <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 14px; color: #92400e;">
                    ⚠️ <strong>Acción requerida:</strong> Ingresá a tu panel para confirmar o rechazar este turno. El paciente recibirá una notificación automática.
                  </p>
                </div>

                <center>
                  <a href="${APP_URL}/panel-profesional" class="btn" style="background: #f59e0b; color: white;">
                    Confirmar Turno →
                  </a>
                </center>
              </div>
              <div class="footer">
                <strong>SmartWell</strong> · Bienestar Profesional<br>
                El paciente recibirá una notificación cuando confirmes o rechaces el turno.
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  });

  if (error) {
    console.error('❌ Error sending professional notification email:', error);
    throw new Error(error.message);
  }
  console.log('✅ Professional notification email sent to:', professionalEmail);
}

/**
 * Email al PACIENTE cuando el profesional CONFIRMA el turno
 */
export async function sendAppointmentConfirmedToPatient(data: AppointmentEmailData) {
  const { patientName, patientEmail, professionalName, date, time, duration, price, meetingLink } = data;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: patientEmail,
    subject: '✅ ¡Tu turno fue confirmado! | SmartWell',
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><style>${baseStyles}</style></head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 36px; text-align: center;">
                <div style="font-size: 52px; margin-bottom: 12px;">✅</div>
                <h1 style="color: white; margin: 0 0 8px 0; font-size: 24px;">¡Turno Confirmado!</h1>
                <p style="color: rgba(255,255,255,0.85); margin: 0; font-size: 15px;">Tu sesión fue confirmada por el profesional</p>
              </div>
              <div class="content">
                <p>Hola <strong>${patientName}</strong>,</p>
                <p>¡Excelente noticia! <strong>${professionalName}</strong> confirmó tu turno. Ya podés prepararte para la sesión.</p>

                <div class="details">
                  <h3 style="margin: 0 0 16px 0; color: #059669; font-size: 15px; text-transform: uppercase; letter-spacing: 0.05em;">Detalles de tu Turno</h3>
                  <div class="row"><span class="label">📅 Fecha</span><span class="value">${formatDateES(date)}</span></div>
                  <div class="row"><span class="label">🕐 Hora</span><span class="value">${time} hs</span></div>
                  <div class="row"><span class="label">⏱️ Duración</span><span class="value">${duration} minutos</span></div>
                  <div class="row"><span class="label">👤 Profesional</span><span class="value">${professionalName}</span></div>
                  <div class="row"><span class="label">💰 Precio</span><span class="value">$${price.toLocaleString('es-AR')}</span></div>
                  <div class="row"><span class="label">📌 Estado</span><span class="value" style="color: #10b981; font-weight: 700;">✅ Confirmado</span></div>
                </div>

                ${meetingLink ? `
                <div style="background: #ecfdf5; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                  <p style="margin: 0 0 8px 0; font-weight: 700; color: #065f46; font-size: 15px;">🎥 Link de Videollamada</p>
                  <p style="margin: 0 0 16px 0; font-size: 13px; color: #6b7280;">Disponible 15 minutos antes de tu sesión</p>
                  <a href="${meetingLink}" class="btn" style="background: #10b981; color: white;">Acceder a la Videollamada</a>
                </div>
                ` : ''}

                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 14px; color: #166534;">
                    💡 <strong>Consejos para tu sesión:</strong><br>
                    • Asegurate de tener buena conexión a internet<br>
                    • Buscá un lugar tranquilo y privado<br>
                    • Conectate 5 minutos antes de la hora pactada
                  </p>
                </div>

                <center>
                  <a href="${APP_URL}/panel-usuario/turnos" class="btn" style="background: #10b981; color: white;">
                    Ver Mis Turnos
                  </a>
                </center>
              </div>
              <div class="footer">
                <strong>SmartWell</strong> · Bienestar Profesional<br>
                ¡Te deseamos una excelente sesión!
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  });

  if (error) {
    console.error('❌ Error sending appointment confirmed email:', error);
    throw new Error(error.message);
  }
  console.log('✅ Appointment confirmed email sent to patient:', patientEmail);
}

/**
 * Email al PACIENTE cuando el profesional CANCELA el turno
 */
export async function sendAppointmentCancelledToPatient(data: AppointmentEmailData) {
  const { patientName, patientEmail, professionalName, date, time } = data;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: patientEmail,
    subject: '❌ Turno cancelado | SmartWell',
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><style>${baseStyles}</style></head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 36px; text-align: center;">
                <div style="font-size: 52px; margin-bottom: 12px;">❌</div>
                <h1 style="color: white; margin: 0 0 8px 0; font-size: 24px;">Turno Cancelado</h1>
                <p style="color: rgba(255,255,255,0.85); margin: 0; font-size: 15px;">Lamentamos informarte que tu turno fue cancelado</p>
              </div>
              <div class="content">
                <p>Hola <strong>${patientName}</strong>,</p>
                <p>Lamentablemente, <strong>${professionalName}</strong> tuvo que cancelar el siguiente turno:</p>

                <div class="details">
                  <h3 style="margin: 0 0 16px 0; color: #dc2626; font-size: 15px; text-transform: uppercase; letter-spacing: 0.05em;">Turno Cancelado</h3>
                  <div class="row"><span class="label">📅 Fecha</span><span class="value">${formatDateES(date)}</span></div>
                  <div class="row"><span class="label">🕐 Hora</span><span class="value">${time} hs</span></div>
                  <div class="row"><span class="label">👤 Profesional</span><span class="value">${professionalName}</span></div>
                </div>

                <p style="color: #6b7280; font-size: 14px;">Podés reservar un nuevo turno con este u otro profesional cuando quieras.</p>

                <center>
                  <a href="${APP_URL}/profesionales" class="btn" style="background: #6366f1; color: white;">
                    Reservar Nuevo Turno
                  </a>
                </center>
              </div>
              <div class="footer">
                <strong>SmartWell</strong> · Bienestar Profesional<br>
                Disculpá los inconvenientes ocasionados.
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  });

  if (error) {
    console.error('❌ Error sending appointment cancelled email:', error);
    throw new Error(error.message);
  }
  console.log('✅ Appointment cancelled email sent to patient:', patientEmail);
}

/**
 * Email de RECORDATORIO al paciente (24 horas antes)
 */
export async function sendAppointmentReminderEmail(data: AppointmentEmailData) {
  const { patientName, patientEmail, professionalName, date, time, meetingLink } = data;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: patientEmail,
    subject: '⏰ Recordatorio: Tu sesión es mañana | SmartWell',
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><style>${baseStyles}</style></head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 36px; text-align: center;">
                <div style="font-size: 52px; margin-bottom: 12px;">⏰</div>
                <h1 style="color: white; margin: 0 0 8px 0; font-size: 24px;">Recordatorio de Turno</h1>
                <p style="color: rgba(255,255,255,0.85); margin: 0; font-size: 15px;">Tu sesión es mañana</p>
              </div>
              <div class="content">
                <p>Hola <strong>${patientName}</strong>,</p>
                <p>Te recordamos que mañana tenés tu sesión con <strong>${professionalName}</strong>.</p>

                <div class="details">
                  <h3 style="margin: 0 0 16px 0; color: #d97706; font-size: 15px; text-transform: uppercase; letter-spacing: 0.05em;">Detalles del Turno</h3>
                  <div class="row"><span class="label">📅 Fecha</span><span class="value">${formatDateES(date)}</span></div>
                  <div class="row"><span class="label">🕐 Hora</span><span class="value">${time} hs</span></div>
                  <div class="row"><span class="label">👤 Profesional</span><span class="value">${professionalName}</span></div>
                </div>

                ${meetingLink ? `
                <div style="background: #fffbeb; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                  <p style="margin: 0 0 8px 0; font-weight: 700; color: #92400e; font-size: 15px;">🎥 Link de Videollamada</p>
                  <a href="${meetingLink}" class="btn" style="background: #f59e0b; color: white;">Unirse a la Sesión</a>
                </div>
                ` : ''}

                <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 14px; color: #92400e;">
                    💡 <strong>Consejos para tu sesión:</strong><br>
                    • Asegurate de tener buena conexión a internet<br>
                    • Buscá un lugar tranquilo y privado<br>
                    • Conectate 5 minutos antes
                  </p>
                </div>
              </div>
              <div class="footer">
                <strong>SmartWell</strong> · Bienestar Profesional<br>
                ¡Te deseamos una excelente sesión!
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  });

  if (error) {
    console.error('❌ Error sending reminder email:', error);
    throw new Error(error.message);
  }
  console.log('✅ Reminder email sent to:', patientEmail);
}

// ── NUEVO: Paciente cancela → avisa al profesional ────────────────────────────
interface CancelledByPatientData {
  patientName: string;
  patientEmail: string;
  professionalName: string;
  professionalEmail: string;
  date: string;
  time: string;
  duration: number;
  reason?: string;
}

export async function sendPatientCancelledToProfessional(data: CancelledByPatientData) {
  const { patientName, patientEmail, professionalName, professionalEmail, date, time, duration, reason } = data;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: professionalEmail,
    subject: '❌ Un paciente canceló su turno - SmartWell',
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
              ${reason ? `<div class="row"><span class="label">💬 Motivo</span><span class="value" style="max-width:300px; text-align:right;">${reason}</span></div>` : ''}
            </div>
            <p style="color: #6b7280; font-size: 14px;">Ese horario quedó liberado en tu agenda automáticamente.</p>
            <center><a href="${APP_URL}/panel-profesional" class="btn" style="background: #6366f1; color: white;">Ver Mi Panel</a></center>
          </div>
          <div class="footer"><strong>SmartWell</strong> · Bienestar Profesional</div>
        </div></div></div></body>
      </html>`,
  });

  if (error) {
    console.error('❌ Error sending patient-cancelled email:', error);
    throw new Error(error.message);
  }
  console.log('✅ Patient-cancelled email sent to professional:', professionalEmail);
}

// ── NUEVO: Paciente reagenda → avisa al profesional ───────────────────────────
interface RescheduledByPatientData {
  patientName: string;
  patientEmail: string;
  professionalName: string;
  professionalEmail: string;
  oldDate: string;
  oldTime: string;
  newDate: string;
  newTime: string;
  duration: number;
}

export async function sendPatientRescheduledToProfessional(data: RescheduledByPatientData) {
  const { patientName, patientEmail, professionalName, professionalEmail, oldDate, oldTime, newDate, newTime, duration } = data;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: professionalEmail,
    subject: '🔄 Un paciente reprogramó su turno - SmartWell',
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

  if (error) {
    console.error('❌ Error sending patient-rescheduled email:', error);
    throw new Error(error.message);
  }
  console.log('✅ Patient-rescheduled email sent to professional:', professionalEmail);
}
