const { Resend } = require('resend');
const { query } = require('../config/database');
const logger = require('../config/logger');

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'My Dr <noreply@mydr.com>';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// Email templates
const templates = {
  appointmentCreated: (data) => ({
    subject: `Cita Confirmada - ${data.clinicName || 'My Dr'}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
          .appointment-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .detail { margin: 10px 0; }
          .label { color: #64748b; font-size: 12px; text-transform: uppercase; }
          .value { font-size: 16px; font-weight: 600; color: #1e293b; }
          .btn { display: inline-block; padding: 12px 30px; background: #22c55e; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 5px; }
          .btn-secondary { background: #64748b; }
          .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏥 Cita Programada</h1>
            <p>Su cita ha sido agendada exitosamente</p>
          </div>
          <div class="content">
            <p>Estimado/a <strong>${data.parentName}</strong>,</p>
            <p>Le confirmamos que la cita para <strong>${data.patientName}</strong> ha sido programada:</p>
            
            <div class="appointment-card">
              <div class="detail">
                <div class="label">Fecha</div>
                <div class="value">📅 ${data.date}</div>
              </div>
              <div class="detail">
                <div class="label">Hora</div>
                <div class="value">🕐 ${data.time}</div>
              </div>
              <div class="detail">
                <div class="label">Doctor</div>
                <div class="value">👨‍⚕️ Dr. ${data.doctorName}</div>
              </div>
              <div class="detail">
                <div class="label">Motivo</div>
                <div class="value">${data.reason || 'Consulta general'}</div>
              </div>
              ${data.clinicAddress ? `
              <div class="detail">
                <div class="label">Dirección</div>
                <div class="value">📍 ${data.clinicAddress}</div>
              </div>
              ` : ''}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${APP_URL}/confirm-appointment/${data.confirmationToken}" class="btn">
                ✓ Confirmar Asistencia
              </a>
              <a href="${APP_URL}/cancel-appointment/${data.confirmationToken}" class="btn btn-secondary">
                ✗ Cancelar Cita
              </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px;">
              <strong>Recordatorio:</strong> Por favor llegue 15 minutos antes de su cita. 
              Si necesita cancelar o reprogramar, hágalo con al menos 24 horas de anticipación.
            </p>
          </div>
          <div class="footer">
            <p>${data.clinicName || 'My Dr'} - Sistema de Gestión Médica Pediátrica</p>
            <p>Este es un correo automático, por favor no responda a este mensaje.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  appointmentReminder: (data) => ({
    subject: `Recordatorio: Cita mañana - ${data.clinicName || 'My Dr'}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
          .appointment-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .detail { margin: 10px 0; }
          .label { color: #64748b; font-size: 12px; text-transform: uppercase; }
          .value { font-size: 16px; font-weight: 600; color: #1e293b; }
          .btn { display: inline-block; padding: 12px 30px; background: #22c55e; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
          .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Recordatorio de Cita</h1>
            <p>Su cita es ${data.isToday ? 'HOY' : 'MAÑANA'}</p>
          </div>
          <div class="content">
            <p>Estimado/a <strong>${data.parentName}</strong>,</p>
            <p>Le recordamos que tiene una cita programada para <strong>${data.patientName}</strong>:</p>
            
            <div class="appointment-card">
              <div class="detail">
                <div class="label">Fecha</div>
                <div class="value">📅 ${data.date}</div>
              </div>
              <div class="detail">
                <div class="label">Hora</div>
                <div class="value">🕐 ${data.time}</div>
              </div>
              <div class="detail">
                <div class="label">Doctor</div>
                <div class="value">👨‍⚕️ Dr. ${data.doctorName}</div>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${APP_URL}/confirm-appointment/${data.confirmationToken}" class="btn">
                ✓ Confirmar Asistencia
              </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px;">
              Por favor llegue 15 minutos antes de su cita.
            </p>
          </div>
          <div class="footer">
            <p>${data.clinicName || 'My Dr'}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  appointmentConfirmed: (data) => ({
    subject: `Cita Confirmada ✓ - ${data.clinicName || 'My Dr'}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; text-align: center; }
          .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Asistencia Confirmada</h1>
          </div>
          <div class="content">
            <p>Gracias por confirmar su asistencia a la cita del <strong>${data.date}</strong> a las <strong>${data.time}</strong>.</p>
            <p>¡Lo esperamos!</p>
          </div>
          <div class="footer">
            <p>${data.clinicName || 'My Dr'}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  appointmentCancelled: (data) => ({
    subject: `Cita Cancelada - ${data.clinicName || 'My Dr'}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; text-align: center; }
          .btn { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
          .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Cita Cancelada</h1>
          </div>
          <div class="content">
            <p>La cita del <strong>${data.date}</strong> a las <strong>${data.time}</strong> ha sido cancelada.</p>
            <p>Si desea reagendar, por favor contáctenos.</p>
            <div style="margin-top: 20px;">
              <a href="${APP_URL}/appointments/new" class="btn">Agendar Nueva Cita</a>
            </div>
          </div>
          <div class="footer">
            <p>${data.clinicName || 'My Dr'}</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Send email function
async function sendEmail(to, templateName, data) {
  try {
    const template = templates[templateName];
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    const { subject, html } = template(data);

    // Log the notification attempt
    const logResult = await query(
      `INSERT INTO email_notifications 
       (recipient_email, recipient_name, notification_type, related_entity_type, related_entity_id, subject, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [to, data.parentName || data.patientName, templateName, data.entityType || 'appointment', data.entityId, subject, JSON.stringify(data)]
    );
    const notificationId = logResult.rows[0].id;

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      logger.warn('RESEND_API_KEY not configured, email not sent');
      await query(
        `UPDATE email_notifications SET status = 'failed', error_message = 'API key not configured' WHERE id = $1`,
        [notificationId]
      );
      return { success: false, error: 'Email service not configured' };
    }

    // Send via Resend
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html
    });

    // Update notification status
    await query(
      `UPDATE email_notifications SET status = 'sent', sent_at = CURRENT_TIMESTAMP, resend_message_id = $2 WHERE id = $1`,
      [notificationId, response.id]
    );

    logger.info(`Email sent successfully to ${to}`, { templateName, messageId: response.id });
    return { success: true, messageId: response.id };

  } catch (error) {
    logger.error('Send email error:', error);
    return { success: false, error: error.message };
  }
}

// Send appointment notification
async function sendAppointmentNotification(appointmentId, notificationType = 'appointmentCreated') {
  try {
    // Get appointment details with patient and parent info
    const result = await query(
      `SELECT 
        a.*,
        p.first_name as patient_first_name, p.last_name as patient_last_name,
        d.id as doctor_id,
        u.first_name as doctor_first_name, u.last_name as doctor_last_name,
        c.name as clinic_name, c.address as clinic_address,
        par.email as parent_email, par.first_name as parent_first_name, par.last_name as parent_last_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       LEFT JOIN doctors d ON a.doctor_id = d.id
       LEFT JOIN users u ON d.user_id = u.id
       LEFT JOIN clinics c ON a.clinic_id = c.id
       LEFT JOIN patient_parents pp ON p.id = pp.patient_id AND pp.is_primary = true
       LEFT JOIN parents par ON pp.parent_id = par.id
       WHERE a.id = $1`,
      [appointmentId]
    );

    if (result.rows.length === 0) {
      return { success: false, error: 'Appointment not found' };
    }

    const apt = result.rows[0];

    if (!apt.parent_email) {
      logger.warn('No parent email found for appointment', { appointmentId });
      return { success: false, error: 'No parent email found' };
    }

    const appointmentDate = new Date(apt.appointment_date);
    const data = {
      entityType: 'appointment',
      entityId: appointmentId,
      patientName: `${apt.patient_first_name} ${apt.patient_last_name}`,
      parentName: `${apt.parent_first_name} ${apt.parent_last_name}`,
      doctorName: apt.doctor_first_name ? `${apt.doctor_first_name} ${apt.doctor_last_name}` : 'Por asignar',
      date: appointmentDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      time: appointmentDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      reason: apt.reason,
      clinicName: apt.clinic_name,
      clinicAddress: apt.clinic_address,
      confirmationToken: apt.confirmation_token
    };

    const emailResult = await sendEmail(apt.parent_email, notificationType, data);

    // Update appointment notification status
    if (emailResult.success) {
      const updateField = notificationType === 'appointmentReminder' ? 'reminder_sent_at' : 'confirmation_sent_at';
      await query(
        `UPDATE appointments SET ${updateField} = CURRENT_TIMESTAMP WHERE id = $1`,
        [appointmentId]
      );
    }

    return emailResult;

  } catch (error) {
    logger.error('Send appointment notification error:', error);
    return { success: false, error: error.message };
  }
}

// Process pending reminders (to be called by a cron job)
async function processPendingReminders() {
  try {
    // Find appointments in the next 24 hours that haven't received a reminder
    const result = await query(
      `SELECT a.id
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN patient_parents pp ON p.id = pp.patient_id AND pp.is_primary = true
       JOIN parents par ON pp.parent_id = par.id
       WHERE a.status = 'scheduled'
         AND a.reminder_sent_at IS NULL
         AND a.appointment_date BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
         AND par.email IS NOT NULL`
    );

    logger.info(`Processing ${result.rows.length} appointment reminders`);

    for (const row of result.rows) {
      await sendAppointmentNotification(row.id, 'appointmentReminder');
    }

    return { processed: result.rows.length };
  } catch (error) {
    logger.error('Process reminders error:', error);
    return { error: error.message };
  }
}

module.exports = {
  sendEmail,
  sendAppointmentNotification,
  processPendingReminders,
  templates
};
