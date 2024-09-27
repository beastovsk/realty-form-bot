// models.js
const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
	dialect: "postgres",
	dialectOptions: {
		ssl: {
			require: true,
			rejectUnauthorized: false, // Set this to 'true' if you have proper certificates
		},
	},
	logging: false, // Disable logging; set to true to enable SQL query logging
});

const User = sequelize.define("User", {
	telegramId: {
		type: DataTypes.STRING,
		unique: true,
		allowNull: false,
	},
	isSubscribed: {
		type: DataTypes.BOOLEAN,
		defaultValue: false,
	},
});

const Survey = sequelize.define("Survey", {
	title: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	description: {
		type: DataTypes.STRING,
	},
	questions: {
		type: DataTypes.JSONB,
		allowNull: false,
	},
	ownerId: {
		type: DataTypes.INTEGER,
		allowNull: false,
	},
});

const Response = sequelize.define("Response", {
	answers: {
		type: DataTypes.JSONB,
		allowNull: false,
	},
	surveyId: {
		type: DataTypes.INTEGER,
		allowNull: false,
	},
	respondentId: {
		type: DataTypes.INTEGER,
		allowNull: false,
	},
});

User.hasMany(Survey, { foreignKey: "ownerId" });
Survey.belongsTo(User, { foreignKey: "ownerId" });
Survey.hasMany(Response, { foreignKey: "surveyId" });
Response.belongsTo(Survey, { foreignKey: "surveyId" });

module.exports = { sequelize, User, Survey, Response };
