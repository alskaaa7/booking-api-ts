import { Pool } from 'pg';

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'booking_system',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const initDatabase = async () => {
  const client = await pool.connect();
  try {
    // Создание таблицы events
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        total_seats INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Создание таблицы bookings
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(event_id, user_id)
      )
    `);

    // Создание индексов для оптимизации
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_event_user ON bookings(event_id, user_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_event_id ON bookings(event_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);
    `);

    console.log('Database initialized successfully');
  } finally {
    client.release();
  }
};