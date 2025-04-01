import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  name: string;
}

interface Config {
  port: number;
  isDevelopment: boolean;
  database: DatabaseConfig;
  jwtSecret: string;
}

export const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  isDevelopment: process.env.NODE_ENV !== 'production',
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    name: process.env.DB_NAME || 'parking_system1',
  },
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
}; 