// bot.js
const { Bot, InlineKeyboard, GrammyError, HttpError } = require("grammy");
const { sequelize, User } = require("./models");
require("dotenv").config();
const { hydrate } = require("@grammyjs/hydrate");

const bot = new Bot(process.env.BOT_TOKEN);
bot.use(hydrate);
// Запуск синхронизации с базой данных
// sequelize.sync().then(() => console.log("Database synced"));

bot.api.setMyCommands([
	{ command: "start", description: "Запустить бота" },
	{ command: "menu", description: "Открыть меню" },
]);
// Хэндлер команды /start

bot.command("start", async (ctx) => {
	await ctx.reply(`Приветствую, bot.`);
	// const telegramId = ctx.from?.id.toString();
	// // Создаем пользователя, если его нет в БД
	// let [user] = await User.findOrCreate({ where: { telegramId } });
	// // Проверяем подписку
	// if (!user.isSubscribed) {
	// 	return ctx.reply(
	// 		"Добро пожаловать! Чтобы создать анкету, нужно оформить подписку.",
	// 		{
	// 			reply_markup: new InlineKeyboard().text(
	// 				"Оформить подписку",
	// 				"subscribe"
	// 			),
	// 		}
	// 	);
	// }
	// ctx.reply("Привет! Вы можете создавать анкеты для сбора информации.");
});

// bot.command("menu", async (ctx) => {
// 	const menuKeyboard = new InlineKeyboard()
// 		.text("Создать список вопросов", "create-questions")
// 		.text("Показать тарифы", "show-payment")
// 		.text("Как мне поможет бот?", "about")
// 		.url("Поддержка", "support");

// 	await ctx.reply("Главное меню", { reply_markup: menuKeyboard });
// });

// bot.callbackQuery('')

// // Обработчик запроса перед оплатой (обязательный шаг)
// bot.on("pre_checkout_query", async (ctx) => {
// 	try {
// 		console.log(
// 			"Received pre_checkout_query:",
// 			ctx.update.pre_checkout_query
// 		);
// 		await ctx.answerPreCheckoutQuery(true);
// 		console.log("Pre-checkout query confirmed successfully.");
// 	} catch (error) {
// 		console.error("Error confirming pre_checkout_query:", error);
// 		await ctx.reply("Ошибка при подтверждении платежа. Попробуйте позже.");
// 	}
// });

// // Обработчик нажатия на кнопку подписки
// bot.callbackQuery("subscribe", async (ctx) => {
// 	try {
// 		await ctx.api.sendInvoice(
// 			ctx.chat.id, // ID чата
// 			"Подписка на сервис", // Заголовок
// 			"Обработка лидов и получение анкеты", // Описание
// 			JSON.stringify({ userId: ctx.from?.id }), // Payload с ID пользователя
// 			"RUB", // Валюта
// 			[{ label: "Подписка", amount: 30000 }], // Цена в минимальных единицах (30000 = 300 RUB)
// 			{
// 				start_parameter: "subscription",
// 				is_flexible: false,
// 				provider_token: process.env.PAYMENT_PROVIDER_TOKEN, // Токен платежного провайдера
// 			}
// 		);
// 	} catch (error) {
// 		console.error("Error sending invoice:", error);
// 		ctx.reply("Не удалось создать инвойс. Попробуйте позже.");
// 	}
// });

// Обработчик успешного платежа
// bot.on("message", async (ctx) => {
// 	const payment = ctx.message?.successful_payment;
// 	if (payment) {
// 		try {
// 			console.log("Received successful payment:", payment);
// 			// Извлекаем userId из payload успешного платежа
// 			const { userId } = JSON.parse(payment.invoice_payload);

// 			// Обновляем статус подписки у пользователя
// 			await User.update(
// 				{ isSubscribed: true },
// 				{ where: { telegramId: userId } }
// 			);
// 			console.log(
// 				"User subscription updated successfully for userId:",
// 				userId
// 			);

// 			ctx.reply(
// 				"Подписка успешно оформлена! Теперь вы можете создавать анкеты."
// 			);
// 		} catch (error) {
// 			console.error("Error handling successful payment:", error);
// 			ctx.reply("Ошибка при обработке платежа. Попробуйте позже.");
// 		}
// 	}
// });

bot.catch((err) => {
	const ctx = err.ctx;
	console.error(ctx.update.update_id);
	const e = err.error;

	if (e instanceof GrammyError) {
		console.error(`Error in request: ${e.description}`);
	} else if (e instanceof HttpError) {
		console.error(`Telegram error: ${e}`);
	} else {
		console.error(`Unknown error: ${e}`);
	}
});

bot.start();
