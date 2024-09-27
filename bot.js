// bot.js
const { Bot, InlineKeyboard } = require("grammy");
const { sequelize, User } = require("./models");
require("dotenv").config();

const bot = new Bot(process.env.BOT_TOKEN);

// Запуск синхронизации с базой данных
sequelize.sync().then(() => console.log("Database synced"));

// Хэндлер команды /start

bot.command("start", async (ctx) => {
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

// Обработчик запроса перед оплатой (обязательный шаг)
bot.on("pre_checkout_query", async (ctx) => {
	try {
		console.log(
			"Received pre_checkout_query:",
			ctx.update.pre_checkout_query
		);
		await ctx.answerPreCheckoutQuery(true);
		console.log("Pre-checkout query confirmed successfully.");
	} catch (error) {
		console.error("Error confirming pre_checkout_query:", error);
		await ctx.reply("Ошибка при подтверждении платежа. Попробуйте позже.");
	}
});

// Обработчик нажатия на кнопку подписки
bot.callbackQuery("subscribe", async (ctx) => {
	try {
		console.log(
			ctx.chat.id, // ID чата
			"Подписка на сервис", // Заголовок
			"Обработка лидов и получение анкеты", // Описание
			JSON.stringify({ userId: ctx.from?.id }), // Payload с ID пользователя
			"RUB", // Валюта
			[{ label: "Подписка", amount: 30000 }], // Цена в минимальных единицах (30000 = 300 RUB)
			{
				start_parameter: "subscription",
				is_flexible: false,
				provider_token: process.env.PAYMENT_PROVIDER_TOKEN, // Токен платежного провайдера
			}
		);
		await ctx.api.sendInvoice(
			ctx.chat.id, // ID чата
			"Подписка на сервис", // Заголовок
			"Обработка лидов и получение анкеты", // Описание
			JSON.stringify({ userId: ctx.from?.id }), // Payload с ID пользователя
			"RUB", // Валюта
			[{ label: "Подписка", amount: 30000 }], // Цена в минимальных единицах (30000 = 300 RUB)
			{
				start_parameter: "subscription",
				is_flexible: false,
				provider_token: process.env.PAYMENT_PROVIDER_TOKEN, // Токен платежного провайдера
			}
		);
	} catch (error) {
		console.error("Error sending invoice:", error);
		ctx.reply("Не удалось создать инвойс. Попробуйте позже.");
	}
});

// Обработчик успешного платежа
bot.on("message", async (ctx) => {
	const payment = ctx.message?.successful_payment;
	if (payment) {
		try {
			console.log("Received successful payment:", payment);
			// Извлекаем userId из payload успешного платежа
			const { userId } = JSON.parse(payment.invoice_payload);

			// Обновляем статус подписки у пользователя
			await User.update(
				{ isSubscribed: true },
				{ where: { telegramId: userId } }
			);
			console.log(
				"User subscription updated successfully for userId:",
				userId
			);

			ctx.reply(
				"Подписка успешно оформлена! Теперь вы можете создавать анкеты."
			);
		} catch (error) {
			console.error("Error handling successful payment:", error);
			ctx.reply("Ошибка при обработке платежа. Попробуйте позже.");
		}
	}
});

// Хэндлер команды для создания анкеты
bot.command("create_survey", async (ctx) => {
	const user = await User.findOne({
		where: { telegramId: ctx.from?.id.toString() },
	});

	if (!user || !user.isSubscribed) {
		return ctx.reply("Для создания анкеты необходимо оформить подписку.");
	}

	ctx.reply("Введите название анкеты:");

	// Здесь создаем временное состояние для пользователя, чтобы получать данные по анкетам
	bot.on("message:text", async (msgctx) => {
		const surveyName = msgctx.message.text;

		// Далее нужно запросить вопросы и сохранить анкету
		await ctx.reply(
			`Анкета "${surveyName}" создана. Теперь введите вопросы.`
		);

		// Логика сохранения вопросов и завершения анкеты может быть добавлена здесь
	});
});

// Запуск бота
bot.start();
