import { DataSource } from "typeorm";
import { config } from "dotenv";
import { User } from "../entities/User";
import { Ticket } from "../entities/Ticket";
import { Payment } from "../entities/Payment";
import { VehicleType } from "../entities/VehicleType";
import { Logger } from '../../shared/services/Logger';

config();

const logger = Logger.getInstance();

const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true',
    synchronize: false, // Set to false in production
    logging: process.env.NODE_ENV === "development",
    entities: [User, Ticket, Payment, VehicleType],
    migrations: ["src/server/migrations/*.ts"],
    subscribers: ['src/server/subscribers/*.ts'],
});

AppDataSource.initialize()
    .then(() => {
        logger.info('Database connection established');
    })
    .catch((error) => {
        logger.error('Error connecting to database:', error);
        process.exit(1);
    });

export default AppDataSource; 