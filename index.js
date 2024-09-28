const { Bot, InlineKeyboard } = require("grammy");
const { hydrate } = require("@grammyjs/hydrate");
const { requests, questions } = require("./data");
require("dotenv").config();

const bot = new Bot(process.env.BOT_TOKEN);
bot.use(hydrate());

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
	.text("Как мне поможет бот?", "about")
	.url("Поддержка", "https://t.me/beastovsk");

let isQuestion = false;

bot.command("start", async (ctx) => {
	const name = ctx.from.first_name;
	await ctx.react("👍");
	await ctx.reply(`Приветствую, ${name}! \nНаш бот создан, чтобы облегчить твою работу с лидами и сэкономить драгоценное время. 🚀 Мы понимаем, как важно быстро и точно собирать данные от клиентов, без долгих переписок и уточнений.

С помощью нашего решения ты сможешь автоматизировать процесс сбора информации, упрощая взаимодействие с потенциальными покупателями и делая ваш рабочий процесс более эффективным! 📊✨`);
	await ctx.reply(
		`Главное меню\n- У тебя ${requests.length} заявок\n- Текущий тариф: демо`,
		{
			reply_markup: menuKeyboard,
		}
	);
});

bot.command("menu", async (ctx) => {
	await ctx.reply(
		`Главное меню\n- У тебя ${requests.length} заявок\n- Текущий тариф: демо`,
		{
			reply_markup: menuKeyboard,
		}
	);
});

bot.callbackQuery("questions", async (ctx) => {
	const keyboard = new InlineKeyboard();

	questions.forEach((question, index) => {
		if (index % 2 === 0) {
			keyboard.row();
		}
		keyboard.text(
			`Удалить вопрос ${index + 1}`,
			`delete_question_${index}`
		);
	});

	const text = questions.length
		? `Ваши вопросы:\n${questions
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
	const index = parseInt(ctx.match[0].split("_")[1]);

	// Логика удаление с сервером

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
	const keyboard = new InlineKeyboard();

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
	const request = requests[index];

	const answersText = request.answers
		.map((answer) => `*${answer.question}*\n${answer.response}`)
		.join("\n\n");

	// Создаем клавиатуру с кнопкой назад
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
	const paymentKeyboard = new InlineKeyboard()
		.text("Бесплатно", "payment_1")
		.text("На день", " payment_2")
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
Цена: 1,499 руб.`,
		{ reply_markup: paymentKeyboard }
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
	const index = parseInt(ctx.match[0].split("_")[1]);
	let price = 0;
	let plan = "";
	if (index === 1) {
		await ctx.reply("Пробный план подключен");
		return;
	}

	switch (index) {
		case 2:
			price = 9900;
			plan = "На день";
			break;
		case 3:
			price = 49900;
			plan = "На неделю";
			break;
		case 4:
			price = 149900;
			plan = "На месяц";
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

bot.callbackQuery("back", async (ctx) => {
	await ctx.callbackQuery.message.editText(
		`Главное меню\n- У тебя ${requests.length} заявок\n- Текущий тариф: демо`,
		{ reply_markup: menuKeyboard }
	);
});

bot.on("message", async (ctx) => {
	const payment = ctx.message?.successful_payment;
	const message = ctx.update.message;

	if (isQuestion) {
		isQuestion = false;
		// Логика добавление вопроса на сервер
		questions.push(message.text);
		ctx.reply("Вопрос записан", {
			reply_markup: new InlineKeyboard().text("Вернуться", "questions"),
		});
	}

	if (payment) {
		try {
			const { userId } = JSON.parse(payment.invoice_payload);

			ctx.reply(
				"Подписка успешно оформлена! Теперь вы можете создавать анкеты."
			);
		} catch (error) {
			console.error("Error handling successful payment:", error);
			ctx.reply("Ошибка при обработке платежа. Попробуйте позже.");
		}
	}
});

bot.start();
