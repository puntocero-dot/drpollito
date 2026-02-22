const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const logger = require('../config/logger');

const router = express.Router();

// Get doctor's schedule blocks (unavailable times)
router.get('/blocks', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, doctorId } = req.query;
    
    // If user is a doctor, get their own blocks. Admin can query any doctor.
    let targetDoctorId = doctorId;
    if (!targetDoctorId && req.user.role === 'doctor') {
      const doctorResult = await query(
        'SELECT id FROM doctors WHERE user_id = $1',
        [req.user.id]
      );
      targetDoctorId = doctorResult.rows[0]?.id;
    }

    if (!targetDoctorId) {
      return res.status(400).json({ error: 'Doctor ID required' });
    }

    let sql = `
      SELECT id, doctor_id, start_datetime, end_datetime, block_type, reason, 
             is_recurring, recurrence_pattern, created_at
      FROM doctor_schedule_blocks
      WHERE doctor_id = $1
    `;
    const params = [targetDoctorId];

    if (startDate) {
      sql += ` AND end_datetime >= $${params.length + 1}`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND start_datetime <= $${params.length + 1}`;
      params.push(endDate);
    }

    sql += ' ORDER BY start_datetime ASC';

    const result = await query(sql, params);

    res.json(result.rows.map(row => ({
      id: row.id,
      doctorId: row.doctor_id,
      startDatetime: row.start_datetime,
      endDatetime: row.end_datetime,
      blockType: row.block_type,
      reason: row.reason,
      isRecurring: row.is_recurring,
      recurrencePattern: row.recurrence_pattern,
      createdAt: row.created_at
    })));
  } catch (error) {
    logger.error('Get schedule blocks error:', error);
    res.status(500).json({ error: 'Failed to get schedule blocks' });
  }
});

// Create schedule block
router.post('/blocks', authenticateToken, requireRole('doctor', 'admin'), [
  body('startDatetime').isISO8601(),
  body('endDatetime').isISO8601(),
  body('blockType').optional().isIn(['unavailable', 'vacation', 'personal', 'meeting']),
  body('reason').optional().isString()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { startDatetime, endDatetime, blockType = 'unavailable', reason, isRecurring, recurrencePattern, doctorId } = req.body;

    // Get doctor ID
    let targetDoctorId = doctorId;
    if (!targetDoctorId) {
      const doctorResult = await query(
        'SELECT id FROM doctors WHERE user_id = $1',
        [req.user.id]
      );
      targetDoctorId = doctorResult.rows[0]?.id;
    }

    if (!targetDoctorId) {
      return res.status(400).json({ error: 'Doctor ID required' });
    }

    // Validate date range
    if (new Date(endDatetime) <= new Date(startDatetime)) {
      return res.status(400).json({ error: 'End datetime must be after start datetime' });
    }

    const result = await query(
      `INSERT INTO doctor_schedule_blocks 
       (doctor_id, start_datetime, end_datetime, block_type, reason, is_recurring, recurrence_pattern)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [targetDoctorId, startDatetime, endDatetime, blockType, reason, isRecurring || false, recurrencePattern ? JSON.stringify(recurrencePattern) : null]
    );

    const block = result.rows[0];
    res.status(201).json({
      id: block.id,
      doctorId: block.doctor_id,
      startDatetime: block.start_datetime,
      endDatetime: block.end_datetime,
      blockType: block.block_type,
      reason: block.reason
    });
  } catch (error) {
    logger.error('Create schedule block error:', error);
    res.status(500).json({ error: 'Failed to create schedule block' });
  }
});

// Update schedule block
router.put('/blocks/:id', authenticateToken, requireRole('doctor', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { startDatetime, endDatetime, blockType, reason } = req.body;

    const result = await query(
      `UPDATE doctor_schedule_blocks 
       SET start_datetime = COALESCE($2, start_datetime),
           end_datetime = COALESCE($3, end_datetime),
           block_type = COALESCE($4, block_type),
           reason = COALESCE($5, reason),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, startDatetime, endDatetime, blockType, reason]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Block not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Update schedule block error:', error);
    res.status(500).json({ error: 'Failed to update schedule block' });
  }
});

// Delete schedule block
router.delete('/blocks/:id', authenticateToken, requireRole('doctor', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM doctor_schedule_blocks WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Block not found' });
    }

    res.json({ message: 'Block deleted successfully' });
  } catch (error) {
    logger.error('Delete schedule block error:', error);
    res.status(500).json({ error: 'Failed to delete schedule block' });
  }
});

// Get doctor's working hours
router.get('/working-hours', authenticateToken, async (req, res) => {
  try {
    const { doctorId } = req.query;

    let targetDoctorId = doctorId;
    if (!targetDoctorId && req.user.role === 'doctor') {
      const doctorResult = await query(
        'SELECT id FROM doctors WHERE user_id = $1',
        [req.user.id]
      );
      targetDoctorId = doctorResult.rows[0]?.id;
    }

    if (!targetDoctorId) {
      return res.status(400).json({ error: 'Doctor ID required' });
    }

    const result = await query(
      `SELECT id, day_of_week, start_time, end_time, is_active, clinic_id
       FROM doctor_working_hours
       WHERE doctor_id = $1
       ORDER BY day_of_week, start_time`,
      [targetDoctorId]
    );

    res.json(result.rows.map(row => ({
      id: row.id,
      dayOfWeek: row.day_of_week,
      startTime: row.start_time,
      endTime: row.end_time,
      isActive: row.is_active,
      clinicId: row.clinic_id
    })));
  } catch (error) {
    logger.error('Get working hours error:', error);
    res.status(500).json({ error: 'Failed to get working hours' });
  }
});

// Set doctor's working hours
router.put('/working-hours', authenticateToken, requireRole('doctor', 'admin'), async (req, res) => {
  try {
    const { workingHours, doctorId } = req.body;

    let targetDoctorId = doctorId;
    if (!targetDoctorId) {
      const doctorResult = await query(
        'SELECT id FROM doctors WHERE user_id = $1',
        [req.user.id]
      );
      targetDoctorId = doctorResult.rows[0]?.id;
    }

    if (!targetDoctorId) {
      return res.status(400).json({ error: 'Doctor ID required' });
    }

    // Delete existing working hours
    await query('DELETE FROM doctor_working_hours WHERE doctor_id = $1', [targetDoctorId]);

    // Insert new working hours
    for (const wh of workingHours) {
      if (wh.isActive !== false) {
        await query(
          `INSERT INTO doctor_working_hours (doctor_id, day_of_week, start_time, end_time, is_active, clinic_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [targetDoctorId, wh.dayOfWeek, wh.startTime, wh.endTime, wh.isActive ?? true, wh.clinicId]
        );
      }
    }

    res.json({ message: 'Working hours updated successfully' });
  } catch (error) {
    logger.error('Set working hours error:', error);
    res.status(500).json({ error: 'Failed to set working hours' });
  }
});

// Get available slots for a doctor on a specific date
router.get('/available-slots', authenticateToken, async (req, res) => {
  try {
    const { doctorId, date, duration = 30 } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({ error: 'Doctor ID and date required' });
    }

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    // Get working hours for this day
    const workingHoursResult = await query(
      `SELECT start_time, end_time FROM doctor_working_hours
       WHERE doctor_id = $1 AND day_of_week = $2 AND is_active = true`,
      [doctorId, dayOfWeek]
    );

    if (workingHoursResult.rows.length === 0) {
      return res.json({ slots: [], message: 'Doctor does not work on this day' });
    }

    const workingHours = workingHoursResult.rows[0];

    // Get blocked times for this date
    const blocksResult = await query(
      `SELECT start_datetime, end_datetime FROM doctor_schedule_blocks
       WHERE doctor_id = $1 
       AND DATE(start_datetime) <= $2 AND DATE(end_datetime) >= $2`,
      [doctorId, date]
    );

    // Get existing appointments for this date
    const appointmentsResult = await query(
      `SELECT appointment_date, duration_minutes FROM appointments
       WHERE doctor_id = $1 AND DATE(appointment_date) = $2
       AND status NOT IN ('cancelled', 'no_show')`,
      [doctorId, date]
    );

    // Generate available slots
    const slots = [];
    const slotDuration = parseInt(duration);
    
    const startTime = new Date(`${date}T${workingHours.start_time}`);
    const endTime = new Date(`${date}T${workingHours.end_time}`);

    let currentSlot = new Date(startTime);

    while (currentSlot < endTime) {
      const slotEnd = new Date(currentSlot.getTime() + slotDuration * 60000);
      
      // Check if slot is blocked
      const isBlocked = blocksResult.rows.some(block => {
        const blockStart = new Date(block.start_datetime);
        const blockEnd = new Date(block.end_datetime);
        return currentSlot < blockEnd && slotEnd > blockStart;
      });

      // Check if slot has an appointment
      const hasAppointment = appointmentsResult.rows.some(apt => {
        const aptStart = new Date(apt.appointment_date);
        const aptEnd = new Date(aptStart.getTime() + (apt.duration_minutes || 30) * 60000);
        return currentSlot < aptEnd && slotEnd > aptStart;
      });

      if (!isBlocked && !hasAppointment && slotEnd <= endTime) {
        slots.push({
          startTime: currentSlot.toISOString(),
          endTime: slotEnd.toISOString(),
          display: currentSlot.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        });
      }

      currentSlot = new Date(currentSlot.getTime() + slotDuration * 60000);
    }

    res.json({ slots });
  } catch (error) {
    logger.error('Get available slots error:', error);
    res.status(500).json({ error: 'Failed to get available slots' });
  }
});

module.exports = router;
