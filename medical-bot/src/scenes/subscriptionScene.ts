import { Scenes, Markup } from 'telegraf';
import { BotContext } from '../botContext';


const subscriptionScene = new Scenes.BaseScene<BotContext>('subscription');
// await ctx.scene.enter('subscription')

subscriptionScene.enter(async (ctx) => {
  console.log(' вошли в сцену')
  
  await ctx.reply(
    'Подписка стоит 500₽/месяц. Оплатить?',
    Markup.inlineKeyboard([
      [Markup.button.callback('💳 Оплатить', 'pay')],
      [Markup.button.callback('❌ Отмена', 'cancel')]
    ])
  );
});

// subscriptionScene.enter(async (ctx) => {
//     console.log('Вошли в сцену подписки');
    
//   }); 
subscriptionScene.action('pay', async (ctx) => {
  await ctx.reply('Оплата через СБП. В разработке 😊');
  await ctx.scene.leave();
});


subscriptionScene.action('cancel', async (ctx) => {
  await ctx.reply('Оплата отменена');
  await ctx.scene.leave();
});

export default subscriptionScene;



