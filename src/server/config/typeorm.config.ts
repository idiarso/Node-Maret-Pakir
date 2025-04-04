import { DataSource } from 'typeorm';
import * as path from 'path';
import { Device } from '../entities/Device';
import { DeviceHealthCheck } from '../entities/DeviceHealthCheck';
import { DeviceLog } from '../entities/DeviceLog';
import { User } from '../entities/User';
import { Vehicle } from '../entities/Vehicle';
import { ParkingArea } from '../entities/ParkingArea';
import { ParkingSession } from '../entities/ParkingSession';
import { Ticket } from '../entities/Ticket';
import { Gate } from '../entities/Gate';
import { GateLog } from '../entities/GateLog';
import { Membership } from '../entities/Membership';
import { PaymentTransaction } from '../entities/PaymentTransaction';
import { VehicleType } from '../entities/VehicleType';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'parking_system1',
  synchronize: false,
  logging: true,
  entities: [
    Device,
    DeviceHealthCheck,
    DeviceLog,
    User,
    Vehicle,
    ParkingArea,
    ParkingSession,
    Ticket,
    Gate,
    GateLog,
    Membership,
    PaymentTransaction,
    VehicleType
  ],
  migrations: [path.join(__dirname, '../migrations/**/*.{ts,js}')],
  subscribers: [path.join(__dirname, '../subscribers/**/*.{ts,js}')]
}); 