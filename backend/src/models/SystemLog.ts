import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class SystemLog extends Model {
  public id!: number;
  public timestamp!: Date;
  public level!: 'info' | 'warning' | 'error';
  public category!: string;
  public message!: string;
  public userId!: number;
}

SystemLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    level: {
      type: DataTypes.ENUM('info', 'warning', 'error'),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'system_logs',
  }
); 