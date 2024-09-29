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
	subscriptionStarts: {
		type: DataTypes.DATE,
	},
	subscriptionEnds: {
		type: DataTypes.DATE,
	},
	questions: { type: DataTypes.ARRAY(DataTypes.STRING) },
});

const Requests = sequelize.define("Requests", {
	date: {
		type: DataTypes.DATE,
	},
	answers: { type: DataTypes.ARRAY(DataTypes.JSON) },
	ownerId: {
		type: DataTypes.INTEGER,
		allowNull: false,
	},
});

User.hasMany(Requests, { foreignKey: "ownerId" });
Requests.belongsTo(User, { foreignKey: "ownerId" });

module.exports = { sequelize, User, Requests };
