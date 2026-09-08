const { Pool } = require('pg');
const logger = require('../utils/logger');

// Use DATABASE_URL if provided, otherwise build the connection from parts.
const connectionConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'sidosips',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    };

const pool = new Pool({
  ...connectionConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error('Unexpected PostgreSQL pool error', err);
});

/**
 * Run a parameterized query against the pool.
 * Always use this instead of building SQL strings manually.
 */
async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV !== 'production' && duration > 200) {
    logger.warn(`Slow query (${duration}ms): ${text}`);
  }
  return result;
}

/**
 * Get a dedicated client for running a multi-statement transaction.
 * Caller is responsible for calling client.release().
 */
async function getClient() {
  const client = await pool.connect();
  return client;
}

async function testConnection() {
  const result = await pool.query('SELECT NOW()');
  return result.rows[0];
}

module.exports = { pool, query, getClient, testConnection };
