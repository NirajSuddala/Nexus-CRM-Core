import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'nexus_crm',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
    },
  }
);

export let isDatabaseConnected = false;

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connected successfully');
    isDatabaseConnected = true;
  } catch (error) {
    console.error('Unable to connect to PostgreSQL:', error);
    console.log('Running in demo mode without database. Connect PostgreSQL to enable full functionality.');
    isDatabaseConnected = false;
  }
};

export const syncDatabase = async (force = false): Promise<void> => {
  if (!isDatabaseConnected) {
    console.log('Skipping database sync - no database connection');
    return;
  }
  try {
    await sequelize.sync({ force, alter: !force });
    console.log('Database synchronized');
  } catch (error) {
    console.error('Database sync failed:', error);
    throw error;
  }
};

export default sequelize;
