import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class OperatorShift extends Model {
  public id!: number;
  public operatorId!: number;
  public startTime!: Date;
  public endTime!: Date;
  public status!: 'active' | 'completed';
  public cashAmount!: number;
  public transactionCount!: number;
}

OperatorShift.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    operatorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'completed'),
      allowNull: false,
      defaultValue: 'active',
    },
    cashAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    transactionCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'operator_shifts',
  }
); 