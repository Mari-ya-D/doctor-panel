const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const path = require('path'); // ← Вот эта строка


const pool = new Pool({
    user: 'bot_user',
    host: 'localhost',
    database: 'medical_bot',
    password: '2957288am',
    port: 5432,
});
 require('dotenv').config()


const TELEGRAM_BOT_TOKEN = process.env.BOT_TOKEN;
const axios = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



// Получить все консультации (неотвеченные)
app.get('/consultations', async (req, res) => {
    const { rows } = await pool.query(
        'SELECT id, user_id, message, username, created_at FROM consultations WHERE answer IS NULL ORDER BY created_at DESC'
    );
    res.json(rows);
});

// Отправить ответ 
app.post('/consultations/:id/reply', async (req, res) => {
    const { id } = req.params;
    const { answer } = req.body;
    const result = await pool.query('SELECT user_id FROM consultations WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).send('Not found');
    const userId = result.rows[0].user_id;
    // Сохраняем ответ в БД
    await pool.query('UPDATE consultations SET answer = $1 WHERE id = $2', [answer, id]);
    // Шлём сообщение пользователю через Telegram Bot API
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN }/sendMessage`, {
        chat_id: userId,
        text: 'Ответ врача: ' + answer
    });
    res.send('Ответ отправлен и сохранён!');
});
app.use(express.static(path.join(__dirname, 'doctor-panel')));

app.listen(3000, '0.0.0.0', () => {
    console.log('Doctor admin panel running on http://0.0.0.0:3000');
});