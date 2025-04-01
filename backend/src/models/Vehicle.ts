import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class Vehicle extends Model {
  public id!: number;
  public plateNumber!: string;
  public type!: string;
  public owner!: string;
  public contact!: string;
  public registrationDate!: Date;
  public status!: 'active' | 'blocked';
}

Vehicle.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    plateNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    owner: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    contact: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    registrationDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'blocked'),
      allowNull: false,
      defaultValue: 'active',
    },
  },
  {
    sequelize,
    tableName: 'vehicles',
  }
); 