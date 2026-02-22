const { query } = require('../config/database');
const logger = require('../config/logger');

const logAudit = async (userId, action, entityType, entityId, oldValues = null, newValues = null, req = null) => {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId,
        action,
        entityType,
        entityId,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        req?.ip || null,
        req?.get('User-Agent') || null
      ]
    );
  } catch (error) {
    logger.error('Failed to log audit:', error);
  }
};

const auditMiddleware = (action, entityType) => {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = (data) => {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        const entityId = req.params.id || data?.id || null;
        logAudit(req.user.id, action, entityType, entityId, null, data, req);
      }
      return originalJson(data);
    };
    
    next();
  };
};

module.exports = { logAudit, auditMiddleware };
