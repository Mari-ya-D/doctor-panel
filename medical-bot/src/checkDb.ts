import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',       // например, postgres
  host: 'localhost',              // или другой адрес, если база не локально
  database: 'medical_bot',          // например, testdb
  password: '2957288mA',         // твой пароль
  port: 5432,                     // по умолчанию 5432
});

async function checkConnection() {
  try {
    await pool.connect();
    console.log('Всё отлично! Подключение к PostgreSQL успешно!');

    // Дополнительно: покажем текущее время на сервере БД
    const res = await pool.query('SELECT NOW()');
    console.log('Сервер PostgreSQL отвечает. Время:', res.rows[0].now);

  } catch (error: any) {
    console.log('Ошибка подключения:', error.message);
 } 
 //finally {
  //   await pool.end();
  // }
}

checkConnection();
export default pool