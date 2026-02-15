/**
 * Email notification service for SmartWell
 * Handles sending emails for appointments, confirmations, and reminders
 */

import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your preferred email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

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
}

/**
 * Send appointment confirmation email to patient
 */
export async function sendPatientConfirmationEmail(data: AppointmentEmailData) {
  const { patientName, patientEmail, professionalName, date, time, duration, price } = data;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: patientEmail,
    subject: '✅ Confirmación de Turno - SmartWell',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .appointment-details {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #667eea;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .label {
              font-weight: 600;
              color: #6b7280;
            }
            .value {
              color: #111827;
              font-weight: 500;
            }
            .button {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
              font-weight: 600;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              font-size: 14px;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>¡Turno Confirmado!</h1>
              <p>Tu sesión ha sido reservada exitosamente</p>
            </div>
            <div class="content">
              <p>Hola ${patientName},</p>
              <p>Tu turno con <strong>${professionalName}</strong> ha sido confirmado.</p>
              
              <div class="appointment-details">
                <h3 style="margin-top: 0; color: #667eea;">Detalles del Turno</h3>
                <div class="detail-row">
                  <span class="label">📅 Fecha:</span>
                  <span class="value">${new Date(date).toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })}</span>
                </div>
                <div class="detail-row">
                  <span class="label">🕐 Hora:</span>
                  <span class="value">${time}</span>
                </div>
                <div class="detail-row">
                  <span class="label">⏱️ Duración:</span>
                  <span class="value">${duration} minutos</span>
                </div>
                <div class="detail-row">
                  <span class="label">👤 Profesional:</span>
                  <span class="value">${professionalName}</span>
                </div>
                <div class="detail-row">
                  <span class="label">💰 Precio:</span>
                  <span class="value">$${price}</span>
                </div>
              </div>

              ${data.meetingLink ? `
                <div class="meeting-link">
                  <p style="margin: 0 0 10px 0; font-weight: 600; color: #1e40af;">
                    🎥 Link de Videollamada
                  </p>
                  <p style="margin: 0 0 15px 0; font-size: 14px; color: #6b7280;">
                    Disponible 15 minutos antes de tu sesión
                  </p>
                  <a href="${data.meetingLink}" class="button">
                    Acceder a la Videollamada
                  </a>
                </div>
              ` : ''}

              <center>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/panel-usuario/turnos" class="button">
                  Ver Mis Turnos
                </a>
              </center>

              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                <strong>Importante:</strong> ${data.meetingLink ? 'Podés acceder a la videollamada 15 minutos antes de tu sesión.' : 'Recibirás el link de la videollamada 15 minutos antes de tu sesión.'}
              </p>
            </div>
            <div class="footer">
              <p>SmartWell - Bienestar Profesional</p>
              <p>Si tenés alguna consulta, no dudes en contactarnos.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Patient confirmation email sent to:', patientEmail);
  } catch (error) {
    console.error('❌ Error sending patient confirmation email:', error);
    throw error;
  }
}

/**
 * Send appointment notification email to professional
 */
export async function sendProfessionalNotificationEmail(data: AppointmentEmailData) {
  const { patientName, professionalName, professionalEmail, date, time, duration } = data;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: professionalEmail,
    subject: '🔔 Nuevo Turno Reservado - SmartWell',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .appointment-details {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #667eea;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .label {
              font-weight: 600;
              color: #6b7280;
            }
            .value {
              color: #111827;
              font-weight: 500;
            }
            .button {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
              font-weight: 600;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              font-size: 14px;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Nuevo Turno Reservado</h1>
              <p>Un paciente ha reservado una sesión contigo</p>
            </div>
            <div class="content">
              <p>Hola ${professionalName},</p>
              <p>Tenés un nuevo turno confirmado con <strong>${patientName}</strong>.</p>
              
              <div class="appointment-details">
                <h3 style="margin-top: 0; color: #667eea;">Detalles del Turno</h3>
                <div class="detail-row">
                  <span class="label">📅 Fecha:</span>
                  <span class="value">${new Date(date).toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })}</span>
                </div>
                <div class="detail-row">
                  <span class="label">🕐 Hora:</span>
                  <span class="value">${time}</span>
                </div>
                <div class="detail-row">
                  <span class="label">⏱️ Duración:</span>
                  <span class="value">${duration} minutos</span>
                </div>
                <div class="detail-row">
                  <span class="label">👤 Paciente:</span>
                  <span class="value">${patientName}</span>
                </div>
              </div>

              <center>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/panel-profesional/turnos" class="button">
                  Ver Mis Turnos
                </a>
              </center>
            </div>
            <div class="footer">
              <p>SmartWell - Bienestar Profesional</p>
              <p>Recordá preparar el material necesario para la sesión.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Professional notification email sent to:', professionalEmail);
  } catch (error) {
    console.error('❌ Error sending professional notification email:', error);
    throw error;
  }
}

/**
 * Send appointment reminder email (24 hours before)
 */
export async function sendAppointmentReminderEmail(data: AppointmentEmailData) {
  const { patientName, patientEmail, professionalName, date, time, meetingLink } = data;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: patientEmail,
    subject: '⏰ Recordatorio de Turno - Mañana - SmartWell',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .appointment-details {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #f59e0b;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .label {
              font-weight: 600;
              color: #6b7280;
            }
            .value {
              color: #111827;
              font-weight: 500;
            }
            .button {
              display: inline-block;
              background: #f59e0b;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
              font-weight: 600;
            }
            .meeting-link {
              background: #eff6ff;
              border: 2px solid #3b82f6;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
              text-align: center;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              font-size: 14px;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Recordatorio de Turno</h1>
              <p>Tu sesión es mañana</p>
            </div>
            <div class="content">
              <p>Hola ${patientName},</p>
              <p>Te recordamos que mañana tenés tu sesión con <strong>${professionalName}</strong>.</p>
              
              <div class="appointment-details">
                <h3 style="margin-top: 0; color: #f59e0b;">Detalles del Turno</h3>
                <div class="detail-row">
                  <span class="label">📅 Fecha:</span>
                  <span class="value">${new Date(date).toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })}</span>
                </div>
                <div class="detail-row">
                  <span class="label">🕐 Hora:</span>
                  <span class="value">${time}</span>
                </div>
                <div class="detail-row">
                  <span class="label">👤 Profesional:</span>
                  <span class="value">${professionalName}</span>
                </div>
              </div>

              ${meetingLink ? `
                <div class="meeting-link">
                  <p style="margin: 0 0 10px 0; font-weight: 600; color: #1e40af;">
                    🎥 Link de Videollamada
                  </p>
                  <a href="${meetingLink}" class="button">
                    Unirse a la Sesión
                  </a>
                </div>
              ` : ''}

              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                <strong>Consejos para tu sesión:</strong><br>
                • Asegurate de tener buena conexión a internet<br>
                • Buscá un lugar tranquilo y privado<br>
                • Conectate 5 minutos antes
              </p>
            </div>
            <div class="footer">
              <p>SmartWell - Bienestar Profesional</p>
              <p>¡Te deseamos una excelente sesión!</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Reminder email sent to:', patientEmail);
  } catch (error) {
    console.error('❌ Error sending reminder email:', error);
    throw error;
  }
}
