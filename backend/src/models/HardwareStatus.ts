import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class HardwareStatus extends Model {
  public id!: number;
  public deviceId!: number;
  public cpuUsage!: number;
  public memoryUsage!: number;
  public diskUsage!: number;
  public temperature!: number;
  public lastUpdate!: Date;
  public status!: 'normal' | 'warning' | 'critical';
}

HardwareStatus.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    deviceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'devices',
        key: 'id',
      },
    },
    cpuUsage: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    memoryUsage: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    diskUsage: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    temperature: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    lastUpdate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('normal', 'warning', 'critical'),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'hardware_statuses',
  }
); 