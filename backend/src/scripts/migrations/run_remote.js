const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:AbBeNdwlMirTABiZZhnJBHemQXUdQMhe@switchback.proxy.rlwy.net:31758/railway' });
(async () => {
  try {
    const sql = `
CREATE TABLE IF NOT EXISTS revoked_tokens (
    token TEXT PRIMARY KEY,
    revoked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires ON revoked_tokens(expires_at);
CREATE OR REPLACE FUNCTION cleanup_revoked_tokens() RETURNS void AS $$
BEGIN
    DELETE FROM revoked_tokens WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;
    `;
    await pool.query(sql);
    console.log('Migration successful against Railway DB');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
})();
