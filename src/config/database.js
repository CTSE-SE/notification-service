// src/config/database.js
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 5,        // max 5 connections (shared RDS instance)
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production'
        ? { require: true, rejectUnauthorized: false }
        : false,
    },
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('PostgreSQL connection established successfully.');
    await sequelize.sync({ alter: false }); // Use migrations in production
    logger.info('Database models synchronised.');
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    throw error;
  }
};

module.exports = { sequelize, connectDB };
