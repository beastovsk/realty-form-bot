// bot.js
const { Bot, InlineKeyboard } = require("grammy");
const { sequelize, User, Survey, Response } = require("./models");
require("dotenv").config();

const bot = new Bot(process.env.BOT_TOKEN);

// Запуск синхронизации с базой данных
sequelize.sync().then(() => console.log("Database synced"));

// Хэндлер команды /start
bot.command("start", async (ctx) => {
	const telegramId = ctx.from.id.toString();

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

// Хэндлер нажатия кнопки подписки
bot.callbackQuery("subscribe", async (ctx) => {
	// Создаем инвойс на оплату подписки
	await ctx.replyWithInvoice({
		provider_token: process.env.PAYMENT_PROVIDER_TOKEN,
		currency: "RUB",
		prices: [{ label: "Подписка", amount: 50000 }], // 500 RUB
		description: "Оплата подписки на создание анкет",
		payload: JSON.stringify({ userId: ctx.from.id }),
	});
});

// Обработчик успешного платежа
bot.on("message", async (ctx) => {
	const payment = ctx.message.successful_payment;
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
bot.command("create_survey", async (ctx) => {
	const user = await User.findOne({
		where: { telegramId: ctx.from.id.toString() },
	});

	if (!user || !user.isSubscribed) {
		return ctx.reply("Для создания анкеты необходимо оформить подписку.");
	}

	// Логика создания анкеты
	ctx.reply("Введите название анкеты:");
	bot.on("message:text", async (msgCtx) => {
		// Здесь будет логика сохранения анкеты в базу
		// Сначала запросим у пользователя название и вопросы, потом сохраним в БД
	});
});

bot.start();
