


import { Telegraf, Scenes, session } from 'telegraf';
import { BotContext } from './botContext';
import subscriptionScene from './scenes/subscriptionScene';
import * as dotenv from 'dotenv';

import { Markup } from 'telegraf';
const { Pool } = require('pg');
const pool = new Pool({
  user: 'bot_user',
  host: 'localhost',
  database: 'medical_bot',
  password: '2957288am', // ВАЖНО: чтобы это было типа string
  port: 5432,
});
module.exports = pool;


// Функция проверки подписки
async function hasActiveSubscription(userId: number) {
  const { rows } = await pool.query(
    'SELECT ends_at FROM subscriptions WHERE user_id = $1 ORDER BY ends_at DESC LIMIT 1',
    [userId]
  );
  if (!rows.length) return false;
  // Проверяем, не закончилась ли подписка
  return new Date(rows[0].ends_at) > new Date();
}


async function saveConsultation(userId: number, message: string, username:string| null, type: string, created_at: string) {
  await pool.query(
    'INSERT INTO consultations (user_id, message, username, type, created_at) VALUES ($1, $2, $3, $4, $5)',
    [userId, message, username, type,created_at]
  );
}


dotenv.config();


const bot = new Telegraf<BotContext>(process.env.BOT_TOKEN as string);

// обязательно!
bot.use(session());
// дальше сцены:
const stage = new Scenes.Stage<BotContext>([subscriptionScene]);
bot.use(stage.middleware());

// Команда входа в сцену
bot.command('subscribe', ctx => ctx.scene.enter('subscription'));

// bot.start(async (ctx) => {
//   await ctx.reply('Добро пожаловать в медицинский бот!');
// });


console.log('Бот запущен!');
console.log(`Bot token:`, process.env.BOT_TOKEN)

bot.start(async (ctx) => {
  await ctx.reply(
    'Добро пожаловать в медицинский бот!',
    Markup.keyboard([
      ['📄 Статьи', 'Консультация'],
      ['✅ Подписка']
    ]).resize()
  );
});

bot.hears('📝 Статьи', async (ctx) => {
  await ctx.reply('Раздел статей в разработке 🚧');
});

bot.hears('💳 Подписка', async (ctx) => {
  await ctx.scene.enter('subscription');
  console.log('Обработчик кнопки подписка сработал', ctx.message.text)


});
bot.hears('Консультация', async (ctx) => {

  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply('Ошибка: не удалось определить пользователя.');
    return;
  }

  // Проверяем подписку
  const paid = await hasActiveSubscription(userId);
  if (paid) {
    await ctx.reply('У вас нет активной подписки. Оформите оплату для доступа к консультации. Оплатить вы можете нажав кнопку оплатить');
    return;
  }

  await ctx.reply('Вы в первые консультируетесь?', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Да', callback_data: 'first_time_yes' }],
        [{ text: 'Нет', callback_data: 'first_time_no' }]
      ]
    }
  });
  // ctx.session.awaitingConsultation = true;
});
const doctors = [
  { id: 1, name: 'Суханов Роман Борисович', description: '...', photo: 'https://uro-andro.ru/sites/default/files/2012-11/img_6897_0.jpg' },
  { id: 2, name: 'Давыдов Денис Сергеевич', description: '...', photo: 'https://uro-andro.ru/sites/default/files/2012-11/img_6880_0.jpg' },
  { id: 3, name: 'Данилов Сергей Павлович', description: '...', photo: 'https://uro-andro.ru/sites/default/files/2025-08/danilov2.jpg' }
];
bot.action('first_time_no', async (ctx) => {
  const userId = ctx.from.id;
  ctx.session.consultStep = 'chooseDoctor';

  await ctx.reply('Выберите врача, у которого уже были консультации (пока список общий):');
  for (let doctor of doctors) {
    await ctx.replyWithPhoto(doctor.photo, {
      caption: `${doctor.name}\n${doctor.description}`,
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Выбрать', callback_data: `select_doctor_${doctor.id}` }
          ]
        ]
      }
    });
  }
  await ctx.answerCbQuery();
});
bot.action('first_time_yes', async (ctx) => {
  ctx.session.consultStep = 'chooseDoctor';
  await ctx.reply('Пожалуйста, выберите врача:');
  for (const doctor of doctors) {
    await ctx.replyWithPhoto(doctor.photo, {
      caption: `${doctor.name}\n${doctor.description}`,
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Выбрать', callback_data: `doctor_${doctor.id}` }
          ]
        ]
      }
    });
  }
  await ctx.answerCbQuery();
});

bot.action(/doctor_\d+/, async (ctx) => {
  ctx.session.selectedDoctor = ctx.match[0]; // 'doctor_1', ...
  ctx.session.awaitingConsultation = true;
  await ctx.reply('Опишите ваш вопрос врачу:');
})

bot.on('text', async (ctx) => {
  if (ctx.session.awaitingConsultation) {
    await saveConsultation(
      ctx.from.id,
      ctx.message.text,
      ctx.from.username || '',
      'question',
      new Date().toISOString()
    );
    ctx.session.awaitingConsultation = false;
    ctx.session.selectedDoctor = undefined;
    ctx.session.consultStep = undefined;
    await ctx.reply('Ваш вопрос отправлен врачу!');
  }
});


bot.command('subscribe', (ctx) => ctx.scene.enter('subscription'));

(async () => {
  await bot.telegram.deleteWebhook();
  await bot.launch();
  console.log('Бот запущен!');
})();