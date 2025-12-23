import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type AutomationTriggerType = 'event' | 'time' | 'manual';
export type AutomationStatus = 'active' | 'inactive';

interface AutomationAttributes {
  id: string;
  name: string;
  triggerType: AutomationTriggerType;
  triggerConfig: Record<string, any>;
  actions: Record<string, any>[];
  status: AutomationStatus;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AutomationCreationAttributes extends Optional<AutomationAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Automation extends Model<AutomationAttributes, AutomationCreationAttributes> implements AutomationAttributes {
  public id!: string;
  public name!: string;
  public triggerType!: AutomationTriggerType;
  public triggerConfig!: Record<string, any>;
  public actions!: Record<string, any>[];
  public status!: AutomationStatus;
  public createdBy!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Automation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    triggerType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'trigger_type',
      validate: {
        isIn: [['event', 'time', 'manual']],
      },
    },
    triggerConfig: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: 'trigger_config',
    },
    actions: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'inactive',
      validate: {
        isIn: [['active', 'inactive']],
      },
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'created_by',
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'automations',
    modelName: 'Automation',
  }
);

export default Automation;
