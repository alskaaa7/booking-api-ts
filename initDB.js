const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'password',
  database: 'postgres' // подключение к default DB
});

async function initDatabase() {
  try {
    // Создаем базу данных, если не существует
    await pool.query('CREATE DATABASE booking_system');
    console.log('✅ Database created');
  } catch (e) {
    console.log('ℹ️ Database already exists');
  }

  // Подключаемся к новой БД
  const bookingPool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'password',
    database: 'booking_system'
  });

  try {
    // Создаем таблицы
    await bookingPool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        total_seats INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await bookingPool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(event_id, user_id)
      )
    `);

    // Добавляем тестовые данные
    await bookingPool.query(`
      INSERT INTO events (name, total_seats) VALUES 
      ('Rock Concert', 100),
      ('Tech Conference', 50)
    `);

    console.log('✅ Database initialized with test data');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await bookingPool.end();
    await pool.end();
  }
}

initDatabase();
