const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

// Default preferences
const DEFAULT_PREFERENCES = {
  units: {
    weight: 'kg',        // kg | lb
    height: 'cm',        // cm | in
    temperature: 'celsius', // celsius | fahrenheit
    headCircumference: 'cm' // cm | in
  },
  notifications: {
    emailReminders: true,
    reminderHoursBefore: 24,
    smsReminders: false
  },
  display: {
    language: 'es',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',    // 12h | 24h
    theme: 'system'       // light | dark | system
  },
  consultation: {
    defaultFollowUpDays: 7,
    showGrowthCharts: true,
    showAISuggestions: true
  }
};

// Get user preferences
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT preferences FROM user_preferences WHERE user_id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      // Return defaults if no preferences saved
      return res.json(DEFAULT_PREFERENCES);
    }

    // Merge with defaults to ensure all keys exist
    const savedPrefs = result.rows[0].preferences || {};
    const mergedPrefs = {
      units: { ...DEFAULT_PREFERENCES.units, ...savedPrefs.units },
      notifications: { ...DEFAULT_PREFERENCES.notifications, ...savedPrefs.notifications },
      display: { ...DEFAULT_PREFERENCES.display, ...savedPrefs.display },
      consultation: { ...DEFAULT_PREFERENCES.consultation, ...savedPrefs.consultation }
    };

    res.json(mergedPrefs);
  } catch (error) {
    logger.error('Get preferences error:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

// Update user preferences
router.put('/', authenticateToken, async (req, res) => {
  try {
    const preferences = req.body;

    // Validate preferences structure
    const validatedPrefs = {
      units: {
        weight: ['kg', 'lb'].includes(preferences.units?.weight) ? preferences.units.weight : 'kg',
        height: ['cm', 'in'].includes(preferences.units?.height) ? preferences.units.height : 'cm',
        temperature: ['celsius', 'fahrenheit'].includes(preferences.units?.temperature) ? preferences.units.temperature : 'celsius',
        headCircumference: ['cm', 'in'].includes(preferences.units?.headCircumference) ? preferences.units.headCircumference : 'cm'
      },
      notifications: {
        emailReminders: Boolean(preferences.notifications?.emailReminders),
        reminderHoursBefore: Math.max(1, Math.min(72, parseInt(preferences.notifications?.reminderHoursBefore) || 24)),
        smsReminders: Boolean(preferences.notifications?.smsReminders)
      },
      display: {
        language: ['es', 'en'].includes(preferences.display?.language) ? preferences.display.language : 'es',
        dateFormat: preferences.display?.dateFormat || 'DD/MM/YYYY',
        timeFormat: ['12h', '24h'].includes(preferences.display?.timeFormat) ? preferences.display.timeFormat : '24h',
        theme: ['light', 'dark', 'system'].includes(preferences.display?.theme) ? preferences.display.theme : 'system'
      },
      consultation: {
        defaultFollowUpDays: Math.max(1, Math.min(90, parseInt(preferences.consultation?.defaultFollowUpDays) || 7)),
        showGrowthCharts: Boolean(preferences.consultation?.showGrowthCharts ?? true),
        showAISuggestions: Boolean(preferences.consultation?.showAISuggestions ?? true)
      }
    };

    // Upsert preferences
    await query(
      `INSERT INTO user_preferences (user_id, preferences, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) 
       DO UPDATE SET preferences = $2, updated_at = CURRENT_TIMESTAMP`,
      [req.user.id, JSON.stringify(validatedPrefs)]
    );

    res.json(validatedPrefs);
  } catch (error) {
    logger.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Update specific preference section
router.patch('/:section', authenticateToken, async (req, res) => {
  try {
    const { section } = req.params;
    const sectionData = req.body;

    if (!['units', 'notifications', 'display', 'consultation'].includes(section)) {
      return res.status(400).json({ error: 'Invalid preference section' });
    }

    // Get current preferences
    const result = await query(
      'SELECT preferences FROM user_preferences WHERE user_id = $1',
      [req.user.id]
    );

    let currentPrefs = result.rows[0]?.preferences || DEFAULT_PREFERENCES;
    
    // Update the specific section
    currentPrefs[section] = { ...currentPrefs[section], ...sectionData };

    // Save
    await query(
      `INSERT INTO user_preferences (user_id, preferences, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) 
       DO UPDATE SET preferences = $2, updated_at = CURRENT_TIMESTAMP`,
      [req.user.id, JSON.stringify(currentPrefs)]
    );

    res.json(currentPrefs);
  } catch (error) {
    logger.error('Patch preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Utility functions for unit conversion (exported for use in other routes)
const convertWeight = (value, fromUnit, toUnit) => {
  if (fromUnit === toUnit || !value) return value;
  if (fromUnit === 'kg' && toUnit === 'lb') return Math.round(value * 2.20462 * 100) / 100;
  if (fromUnit === 'lb' && toUnit === 'kg') return Math.round(value / 2.20462 * 100) / 100;
  return value;
};

const convertHeight = (value, fromUnit, toUnit) => {
  if (fromUnit === toUnit || !value) return value;
  if (fromUnit === 'cm' && toUnit === 'in') return Math.round(value / 2.54 * 100) / 100;
  if (fromUnit === 'in' && toUnit === 'cm') return Math.round(value * 2.54 * 100) / 100;
  return value;
};

const convertTemperature = (value, fromUnit, toUnit) => {
  if (fromUnit === toUnit || !value) return value;
  if (fromUnit === 'celsius' && toUnit === 'fahrenheit') return Math.round((value * 9/5 + 32) * 10) / 10;
  if (fromUnit === 'fahrenheit' && toUnit === 'celsius') return Math.round((value - 32) * 5/9 * 10) / 10;
  return value;
};

module.exports = router;
module.exports.convertWeight = convertWeight;
module.exports.convertHeight = convertHeight;
module.exports.convertTemperature = convertTemperature;
module.exports.DEFAULT_PREFERENCES = DEFAULT_PREFERENCES;
