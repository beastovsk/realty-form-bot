const { Bot, InlineKeyboard } = require("grammy");
const { hydrate } = require("@grammyjs/hydrate");
const { questions } = require("./data");
const { sequelize, User, Requests } = require("./models");
require("dotenv").config();

const bot = new Bot(process.env.BOT_TOKEN);
bot.use(hydrate());

sequelize.sync().then(() => console.log("Database synced"));
(async () => {
	await sequelize.sync({ alter: true });
})();

// bot.api.setMyCommands([
// 	{ command: "start", description: "Запустить бота" },
// 	{ command: "menu", description: "Открыть меню" },
// ]);

const menuKeyboard = new InlineKeyboard()
	.text("Мой список вопросов", "questions")
	.text("Мои заявки", "show_requests")
	.row()
	.text("Показать тарифы", "show-payment")
	.row()
	.text("О боте", "about")
	.url("Поддержка", "https://t.me/beastovsk");

let isQuestion = false;

bot.command("start", async (ctx) => {
	const name = ctx.from.first_name;
	const userId = ctx.from.id;
	const telegramId = String(ctx.from.id);
	const user = await User.findOne({ where: { telegramId } });
	const requests = await Requests.findAll({ where: { ownerId: telegramId } });

	if (!user) {
		await User.create({
			id: userId,
			telegramId,
			isSubscribed: false,
			subscriptionPlan: null,
			subscriptionStarts: null,
			subscriptionEnds: null,
			questions: [],
		});
		await ctx.reply(`Приветствую, ${name}! \nНаш бот создан, чтобы облегчить твою работу с лидами и сэкономить драгоценное время. 🚀 Мы понимаем, как важно быстро и точно собирать данные от клиентов, без долгих переписок и уточнений.

	С помощью нашего решения ты сможешь автоматизировать процесс сбора информации, упрощая взаимодействие с потенциальными покупателями и делая ваш рабочий процесс более эффективным! 📊✨`);
	}
	await ctx.reply(
		`Главное меню\n- У тебя ${requests.length} заявок\nВаша персональная ссылка для лидов - https://t.me/reality_form_bot?start=${telegramId}`,
		{
			reply_markup: menuKeyboard,
		}
	);
});

bot.command("menu", async (ctx) => {
	const userId = String(ctx.from.id);
	const requests = await Requests.findAll({ where: { ownerId: userId } });

	await ctx.reply(
		`Главное меню\n- У тебя ${requests.length} заявок\nВаша персональная ссылка для лидов - https://t.me/reality_form_bot?start=${userId}`,
		{ reply_markup: menuKeyboard }
	);
});

bot.callbackQuery("questions", async (ctx) => {
	const keyboard = new InlineKeyboard();
	const telegramId = String(ctx.from.id);

	const user = await User.findOne({ where: { telegramId } });
	const questions = user?.questions;

	if (questions && questions?.length) {
		questions.forEach((question, index) => {
			if (index % 2 === 0) {
				keyboard.row();
			}
			keyboard.text(
				`Удалить вопрос ${index + 1}`,
				`delete_question_${index}`
			);
		});
	}

	const text =
		questions && questions?.length
			? `Ваши вопросы:\n${user.questions
					.map((item, i) => `${i + 1}. ${item}\n`)
					.join("")}`
			: "Список вопросов пуст. Самое время их заполнить.";

	await ctx.callbackQuery.message.editText(text, {
		reply_markup: keyboard
			.row()
			.text("Добавить вопрос", "add_question")
			.row()
			.text("⬅️ Назад", "back"),
	});
});

bot.callbackQuery(/delete_question_\d+/, async (ctx) => {
	const telegramId = String(ctx.from.id);
	const user = await User.findOne({ where: { telegramId } });
	const index = parseInt(ctx.match[0].split("_")[2]);

	user.questions = [
		...user.questions.slice(0, index),
		...user.questions.slice(index + 1),
	];
	await user.save();

	await ctx.callbackQuery.message.editText("Вопрос удален", {
		reply_markup: new InlineKeyboard()
			.row()
			.text("Добавить вопрос", "add_question")
			.row()
			.text("⬅️ Назад", "back"),
	});
});

bot.callbackQuery("add_question", async (ctx) => {
	await ctx.callbackQuery.message.editText("Введите новый вопрос", {
		reply_markup: new InlineKeyboard()
			.row()
			.text("Назад к вопросам", "questions"),
	});
	isQuestion = true;
});
bot.callbackQuery("show_requests", async (ctx) => {
	const telegramId = String(ctx.from.id);
	const requests = await Requests.findAll({ where: { ownerId: telegramId } });
	const user = await User.findOne({ where: { telegramId } });
	const keyboard = new InlineKeyboard();

	const now = new Date();
	// Проверяем, если подписка вообще установлена, а потом — дату окончания
	if (user.subscriptionEnds && user.subscriptionEnds <= now) {
		await user.update({
			isSubscribed: false,
			subscriptionStarts: null,
			subscriptionEnds: null,
		});

		return await ctx.callbackQuery.message.editText(
			"Подписка закончилась, выберите подходящий план",
			{
				reply_markup: new InlineKeyboard().text(
					"Перейти к тарифам",
					"show-payment"
				),
			}
		);
	}

	// Проверяем, активна ли подписка
	if (!user.isSubscribed) {
		return await ctx.callbackQuery.message.editText(
			"Подписка закончилась, выберите подходящий план",
			{
				reply_markup: new InlineKeyboard().text(
					"Перейти к тарифам",
					"show-payment"
				),
			}
		);
	}

	if (!requests || requests.length === 0) {
		await ctx.callbackQuery.message.editText("У вас нет заявок.", {
			reply_markup: keyboard.row().text("⬅️ Назад", "back"),
		});
		return;
	}

	// Добавление кнопок с датами заявок
	requests.forEach((request, index) => {
		keyboard.text(
			`Заявка от ${new Date(request.date).toLocaleString()}`,
			`request_${index}`
		);
	});

	await ctx.callbackQuery.message.editText("Выберите заявку:", {
		reply_markup: keyboard.row().text("⬅️ Назад", "back"),
	});
});

bot.callbackQuery(/request_\d+/, async (ctx) => {
	const index = parseInt(ctx.match[0].split("_")[1]);
	const telegramId = String(ctx.from.id);

	const requests = await Requests.findAll({ where: { ownerId: telegramId } });

	if (index < 0 || index >= requests.length) {
		await ctx.reply("Некорректный выбор заявки.");
		return;
	}

	const request = requests[index];

	const answersText =
		request.answers
			.map((answer) => `*${answer.question}*\n${answer.response}`)
			.join("\n\n") + `\n\nОтправитель - @${request.sender}`;

	const backKeyboard = new InlineKeyboard()
		.text("⬅️ Назад", "show_requests")
		.text("Вернуться в меню", "back");

	await ctx.callbackQuery.message.editText(
		`Дата: ${new Date(request.date).toLocaleString()}\n\n${answersText}`,
		{
			parse_mode: "Markdown",
			reply_markup: backKeyboard,
		}
	);
});

bot.callbackQuery("show-payment", async (ctx) => {
	const telegramId = String(ctx.from.id);
	const user = await User.findOne({ where: { telegramId } });

	// Формируем текст о текущем состоянии подписки
	const subscriptionStatus = user?.isSubscribed
		? `💳 Подписка активна: *${
				user.subscriptionPlan
		  }* \nС: *${user.subscriptionStarts.toLocaleDateString()}* До: *${user.subscriptionEnds.toLocaleDateString()}*`
		: "🚫 Подписка не активна.";

	// Кнопки выбора тарифов
	const paymentKeyboard = new InlineKeyboard()
		.text("Бесплатно", "payment_1")
		.text("На день", "payment_2")
		.row()
		.text("На неделю", "payment_3")
		.text("На месяц", "payment_4")
		.row()
		.text("⬅️ Назад", "back");

	await ctx.callbackQuery.message.editText(
		`Выберите тарифный план:

🎁 Бесплатно на 3 дня — для новых пользователей.
Цена: 0 руб.

📅 День — доступ ко всем функциям на 24 часа.
Цена: 99 руб.

🗓 Неделя — 7 дней неограниченного доступа.
Цена: 499 руб.

📆 Месяц — полный доступ на 30 дней.
Цена: 1,499 руб.

---

🔔 *Текущее состояние подписки* 🔔
${subscriptionStatus}`,
		{ reply_markup: paymentKeyboard, parse_mode: "Markdown" }
	);
});

bot.on("pre_checkout_query", async (ctx) => {
	try {
		await ctx.answerPreCheckoutQuery(true);
		console.log("Pre-checkout query confirmed successfully.");
	} catch (error) {
		console.error("Error confirming pre_checkout_query:", error);
		await ctx.reply("Ошибка при подтверждении платежа. Попробуйте позже.");
	}
});

bot.callbackQuery(/payment_\d+/, async (ctx) => {
	const telegramId = String(ctx.from.id);
	const user = await User.findOne({ where: { telegramId } });
	const index = parseInt(ctx.match[0].split("_")[1]);

	let price = 0;
	let plan = "";

	if (index === 1) {
		const now = new Date();
		const registrationDate = new Date(user.createdAt); // Предполагаем, что у пользователя есть поле createdAt

		// Рассчитываем разницу в днях между текущей датой и датой регистрации
		const daysSinceRegistration = Math.floor(
			(now - registrationDate) / (1000 * 60 * 60 * 24)
		);

		// Если с момента регистрации прошло 3 или более дней
		if (daysSinceRegistration >= 3) {
			await ctx.reply(
				"Срок действия бесплатного плана истёк. Выберите другой тариф."
			);
			return;
		}

		// Если аккаунту меньше 3 дней, активируем пробный план
		const subscriptionStarts = now;
		const subscriptionEnds = new Date(now);
		subscriptionEnds.setDate(subscriptionEnds.getDate() + 3); // Устанавливаем срок окончания через 3 дня

		// Обновляем поля подписки пользователя
		await user.update({
			isSubscribed: true,
			subscriptionPlan: "gift",
			subscriptionStarts,
			subscriptionEnds,
		});

		await ctx.reply("Пробный план активирован на 3 дня!");
		return;
	}

	switch (index) {
		case 2:
			price = 9900;
			plan = "day";
			break;
		case 3:
			price = 49900;
			plan = "week";
			break;
		case 4:
			price = 149900;
			plan = "month";
			break;

		default:
			break;
	}

	await ctx.api.sendInvoice(
		ctx.chat.id, // ID чата
		"Подписка на сервис", // Заголовок
		"Обработка лидов и получение анкеты", // Описание
		JSON.stringify({ userId: ctx.from?.id, plan }), // Payload с ID пользователя
		"RUB", // Валюта
		[{ label: `${plan}`, amount: price }], // Цена в минимальных единицах (30000 = 300 RUB)
		{
			start_parameter: "subscription",
			is_flexible: false,
			provider_token: process.env.PAYMENT_PROVIDER_TOKEN, // Токен платежного провайдера
		}
	);
});

bot.callbackQuery("about", async (ctx) => {
	ctx.callbackQuery.message.editText(
		`
О боте 🤖

Добро пожаловать в наш бот! Этот бот создан для удобного взаимодействия с вами и автоматизации процесса сбора заявок и обратной связи, не выходя из Telegram. 🌟

Вот что он может предложить:

Выбор тарифа: 🏷️ Вы можете легко выбрать подходящий тариф прямо в боте, экономя время на поиски информации!

Создание вопросов: 📝 Создавайте и редактируйте вопросы для опросов без лишних хлопот. Собирайте нужную информацию от клиентов быстро и эффективно!

Личная ссылка: 🔗 Копируйте персональную ссылку и передавайте ее вашим клиентам.

Отслеживание заявок: 📬 Бот будет отслеживать ваши заявки и уведомлять о новых запросах. Быстро реагируйте на вопросы и предложения клиентов!

Благодаря этим функциям наш бот станет вашим надежным помощником для быстрого взаимодействия и управления заявками прямо в Telegram! 🚀`,
		{ reply_markup: new InlineKeyboard().text("Вернуться назад", "back") }
	);
});

bot.callbackQuery("back", async (ctx) => {
	const telegramId = String(ctx.from.id);
	const requests = await Requests.findAll({ where: { ownerId: telegramId } });

	await ctx.callbackQuery.message.editText(
		`Главное меню\n- У тебя ${requests.length} заявок\nВаша персональная ссылка для лидов - https://t.me/reality_form_bot?start=${telegramId}`,
		{ reply_markup: menuKeyboard }
	);
});

bot.on("message", async (ctx) => {
	const payment = ctx.message?.successful_payment;
	const message = ctx.update.message;
	const telegramId = String(ctx.from.id);
	const user = await User.findOne({ where: { telegramId } });

	if (isQuestion) {
		const questions = user?.questions ?? [];

		user.questions = [...questions, message.text];
		await user.save();

		isQuestion = false;

		const replyText = "Вопрос записан";
		const replyMarkup = new InlineKeyboard().text("Вернуться", "questions");

		// Проверка, отличается ли текст сообщения или разметка
		if (
			ctx.update.message.text !== replyText ||
			ctx.update.message.reply_markup !== replyMarkup
		) {
			ctx.reply(replyText, { reply_markup: replyMarkup });
		} else {
			console.log(
				"Текст и разметка уже совпадают. Не нужно обновлять сообщение."
			);
		}
	}

	if (payment) {
		try {
			const { plan } = JSON.parse(payment.invoice_payload);
			// Текущая дата - начало подписки
			const subscriptionStarts = new Date();
			// Копируем текущую дату, чтобы добавить нужное количество дней
			const subscriptionEnds = new Date(subscriptionStarts);

			// В зависимости от плана, увеличиваем срок подписки
			switch (plan) {
				case "day":
					subscriptionEnds.setDate(subscriptionEnds.getDate() + 1);
					break;
				case "week":
					subscriptionEnds.setDate(subscriptionEnds.getDate() + 7);
					break;
				case "month":
					subscriptionEnds.setMonth(subscriptionEnds.getMonth() + 1);
					break;
				default:
					throw new Error("Unknown subscription plan");
			}

			// Обновляем информацию о подписке пользователя в базе данных
			await user.update({
				isSubscribed: true,
				subscriptionPlan: plan,
				subscriptionStarts,
				subscriptionEnds,
			});

			// Подтверждаем успешную оплату и активацию подписки
			await ctx.reply(
				`Подписка на план "${plan}" успешно оформлена! Теперь вы можете создавать анкеты.`
			);
		} catch (error) {
			console.error("Error handling successful payment:", error);
			ctx.reply("Ошибка при обработке платежа. Попробуйте позже.");
		}
	}
});

bot.start();
