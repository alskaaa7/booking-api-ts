const { pool } = require('../dist/config/database'); // или '../src/config/database'

async function seedData() {
  const client = await pool.connect();
  try {
    console.log('Adding test events to database...');
    
    // Очищаем старые данные (опционально)
    await client.query('DELETE FROM bookings');
    await client.query('DELETE FROM events');
    
    // Добавляем тестовые события
    const result = await client.query(`
      INSERT INTO events (name, total_seats) VALUES 
      ('Rock Concert', 100),
      ('Tech Conference', 50),
      ('Art Exhibition', 200)
      RETURNING *;
    `);
    
    console.log('✅ Test events added successfully:');
    result.rows.forEach(event => {
      console.log(`   - ${event.name} (${event.total_seats} seats)`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Запускаем функцию
seedData();