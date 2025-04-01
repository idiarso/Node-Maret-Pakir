import { DataSource } from "typeorm";
import { config } from "dotenv";
import { User } from "../entities/User";
import { Ticket } from "../entities/Ticket";
import { Payment } from "../entities/Payment";
import { VehicleType } from "../entities/VehicleType";
import { Device } from "../entities/Device";
import { DeviceHealthCheck } from "../entities/DeviceHealthCheck";
import { DeviceLog } from "../entities/DeviceLog";
import { Gate } from "../entities/Gate";
import { GateLog } from "../entities/GateLog";
import { ParkingArea } from "../entities/ParkingArea";
import { ParkingSession } from "../entities/ParkingSession";
import { Vehicle } from "../entities/Vehicle";
import { Membership } from "../entities/Membership";
import { SystemSetting } from "../entities/SystemSetting";
import { AuditLog } from "../entities/AuditLog";
import { PaymentTransaction } from "../entities/PaymentTransaction";
import { ParkingRate } from "../entities/ParkingRate";
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
    entities: [
        User,
        Ticket,
        Payment,
        VehicleType,
        Device,
        DeviceHealthCheck,
        DeviceLog,
        Gate,
        GateLog,
        ParkingArea,
        ParkingSession,
        Vehicle,
        Membership,
        SystemSetting,
        AuditLog,
        PaymentTransaction,
        ParkingRate
    ],
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