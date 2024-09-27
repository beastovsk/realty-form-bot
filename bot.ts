import { Context } from "grammy";

// bot.js
const { Bot, InlineKeyboard } = require("grammy");
const { sequelize, User } = require("./models");
require("dotenv").config();

const bot = new Bot(process.env.BOT_TOKEN);

// Запуск синхронизации с базой данных
sequelize.sync().then(() => console.log("Database synced"));

// Хэндлер команды /start
bot.command("start", async (ctx: Context) => {
	const telegramId = ctx.from?.id.toString();

	// Создаем пользователя, если его нет в БД
	let [user] = await User.findOrCreate({ where: { telegramId } });

	// Проверяем подписку
	if (!user.isSubscribed) {
		return ctx.reply(
			"Добро пожаловать! Чтобы создать анкету, нужно оформить подписку.",
			{
				reply_markup: new InlineKeyboard().text(
					"Оформить подписку",
					"subscribe"
				),
			}
		);
	}

	ctx.reply("Привет! Вы можете создавать анкеты для сбора информации.");
});

// Handler for the subscription button click
bot.callbackQuery("subscribe", async (ctx: Context) => {
	try {
		// Send the invoice for subscription payment
		await bot.api.sendInvoice(
			ctx.chat?.id, // chat_id: chat to send the invoice
			"Подписка на создание анкет", // title
			"Оплата подписки на создание анкет", // description
			JSON.stringify({ userId: ctx.from?.id }), // payload
			process.env.PAYMENT_PROVIDER_TOKEN,
			"RUB", // currency: currency code
			[
				{
					label: "Подписка", // Description of the price
					amount: 50000, // Amount in the smallest units of currency (50000 = 500 RUB)
				},
			]
		);
	} catch (error) {
		console.error("Error sending invoice:", error);
		ctx.reply("Не удалось создать инвойс. Попробуйте позже.");
	}
});

// Обработчик успешного платежа
bot.on("message", async (ctx: Context) => {
	const payment = ctx.message?.successful_payment;
	if (payment) {
		// Извлекаем userId из payload успешного платежа
		const { userId } = JSON.parse(payment.invoice_payload);

		// Обновляем статус подписки у пользователя
		await User.update(
			{ isSubscribed: true },
			{ where: { telegramId: userId } }
		);

		ctx.reply(
			"Подписка успешно оформлена! Теперь вы можете создавать анкеты."
		);
	}
});

// Хэндлер команды для создания анкеты
bot.command("create_survey", async (ctx: Context) => {
	const user = await User.findOne({
		where: { telegramId: ctx.from?.id.toString() },
	});

	if (!user || !user.isSubscribed) {
		return ctx.reply("Для создания анкеты необходимо оформить подписку.");
	}

	// Логика создания анкеты
	ctx.reply("Введите название анкеты:");
	bot.on("message:text", async (msgctx: Context) => {
		// Здесь будет логика сохранения анкеты в базу
		// Сначала запросим у пользователя название и вопросы, потом сохраним в БД
	});
});

bot.start();
