const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

// Get all specialties
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM specialties ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching specialties:', error);
    res.status(500).json({ error: 'Failed to fetch specialties' });
  }
});

// Create a new specialty (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const result = await query(
      `INSERT INTO specialties (name, description) VALUES ($1, $2) RETURNING *`,
      [name.trim(), description || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating specialty:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'La especialidad ya existe' });
    }
    res.status(500).json({ error: 'Failed to create specialty' });
  }
});

// Update a specialty (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const result = await query(
      `UPDATE specialties SET name = $1, description = $2 WHERE id = $3 RETURNING *`,
      [name.trim(), description || null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Especialidad no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating specialty:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'La especialidad ya existe' });
    }
    res.status(500).json({ error: 'Failed to update specialty' });
  }
});

// Delete a specialty (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Basic protection: do not let them delete if it's already used? 
    // They are stored as varchar in doctors table, so deleting the specialty catalog metadata won't break anything, 
    // but we can just delete it from specialties table.
    const result = await query('DELETE FROM specialties WHERE id = $1 RETURNING id', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Especialidad no encontrada' });
    }

    res.json({ message: 'Especialidad eliminada' });
  } catch (error) {
    logger.error('Error deleting specialty:', error);
    res.status(500).json({ error: 'Failed to delete specialty' });
  }
});

module.exports = router;
