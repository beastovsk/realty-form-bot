const requests = [
	{
		date: new Date().toISOString(),
		answers: [
			{ question: "Как вас зовут?", response: "Алексей" },
			{
				question: "Какой у вас номер телефона?",
				response: "+1234567890",
			},
			{ question: "Какой у вас email?", response: "alexey@example.com" },
		],
	},
	{
		date: new Date().toISOString(),
		answers: [
			{ question: "Как вас зовут?", response: "Валерий" },
			{
				question: "Какой у вас номер телефона?",
				response: "+3213121211",
			},
			{ question: "Какой у вас email?", response: "valera@example.com" },
		],
	},
];

let questions = ["Как вас зовут?", "Какой у вас номер телефона?"];

module.exports = { requests, questions };
