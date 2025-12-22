import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type EntityType = 'company' | 'contact' | 'deal' | 'task';

interface ActivityAttributes {
  id: string;
  entityType: EntityType;
  entityId: string;
  userId: string | null;
  action: string;
  description: string | null;
  metadata: Record<string, any> | null;
  createdAt?: Date;
}

interface ActivityCreationAttributes extends Optional<ActivityAttributes, 'id' | 'userId' | 'description' | 'metadata' | 'createdAt'> {}

class Activity extends Model<ActivityAttributes, ActivityCreationAttributes> implements ActivityAttributes {
  public id!: string;
  public entityType!: EntityType;
  public entityId!: string;
  public userId!: string | null;
  public action!: string;
  public description!: string | null;
  public metadata!: Record<string, any> | null;
  public readonly createdAt!: Date;
}

Activity.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    entityType: {
      type: DataTypes.ENUM('company', 'contact', 'deal', 'task'),
      allowNull: false,
      field: 'entity_type',
    },
    entityId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'entity_id',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'activities',
    modelName: 'Activity',
    updatedAt: false,
  }
);

export default Activity;
