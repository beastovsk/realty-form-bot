const { Bot, InlineKeyboard } = require("grammy");
const { hydrate } = require("@grammyjs/hydrate");
require("dotenv").config();

const bot = new Bot(process.env.BOT_TOKEN);
bot.use(hydrate());

bot.api.setMyCommands([
	{ command: "start", description: "Запустить бота" },
	{ command: "menu", description: "Открыть меню" },
]);

const menuKeyboard = new InlineKeyboard()
	.text("Создать список вопросов", "create-questions")
	.text("Мои заявки", "show_answers")
	.row()
	.text("Показать тарифы", "show-payment")
	.row()
	.text("Как мне поможет бот?", "about")
	.url("Поддержка", "https://t.me/beastovsk");

const backKeyboard = new InlineKeyboard().text("Вернуться назад", "back");

bot.command("start", async (ctx) => {
	const name = ctx.from.first_name;
	await ctx.react("👍");
	await ctx.reply(`Приветствую, ${name}! \nНаш бот создан, чтобы облегчить твою работу с лидами и сэкономить драгоценное время. 🚀 Мы понимаем, как важно быстро и точно собирать данные от клиентов, без долгих переписок и уточнений.

С помощью нашего решения ты сможешь автоматизировать процесс сбора информации, упрощая взаимодействие с потенциальными покупателями и делая ваш рабочий процесс более эффективным! 📊✨`);
	await ctx.reply(`Главное меню\n- У тебя 0 заявок\n- Текущий тариф: демо`, {
		reply_markup: menuKeyboard,
	});
});

bot.command("menu", async (ctx) => {
	await ctx.reply(`Главное меню\n- У тебя 0 заявок\n- Текущий тариф: демо`, {
		reply_markup: menuKeyboard,
	});
});

bot.callbackQuery("create-questions", async (ctx) => {
	await ctx.callbackQuery.message.editText(
		"Введи свои вопросы через запятую\nПример: В каком районе вы рассматриваете объект?,На сколько квадратных метров?",
		{ reply_markup: backKeyboard }
	);
});

bot.callbackQuery("back", async (ctx) => {
	await ctx.callbackQuery.message.editText(
		`Главное меню\n- У тебя 0 заявок\n- Текущий тариф: демо`,
		{ reply_markup: menuKeyboard }
	);
});

bot.on("message", async (ctx) => {
	const text = ctx.update.message.text;
	console.log(ctx.update.message.text);

	if (text.split(",").length) {
		const questionList = text.split(",");

		await ctx.react("✍");
		await ctx.reply(
			`Ваши вопросы записаны\n${questionList
				.map((question) => `${question}\n`)
				.join("")}`
		);
		await ctx.reply();
		await ctx.reply(
			`Главное меню\n- У тебя 0 заявок\n- Текущий тариф: демо`,
			{
				reply_markup: menuKeyboard,
			}
		);
	}
});

bot.start();
