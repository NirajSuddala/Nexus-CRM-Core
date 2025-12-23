import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type ActivityType = 'email' | 'call' | 'meeting' | 'note' | 'task' | 'created' | 'updated' | 'deleted' | 'stage_changed' | 'status_changed' | 'assigned' | 'comment';

interface ActivityAttributes {
  id: string;
  type: ActivityType;
  contactId: string | null;
  companyId: string | null;
  dealId: string | null;
  taskId: string | null;
  emailId: string | null;
  createdBy: string;
  description: string | null;
  metadata: Record<string, any> | null;
  timestamp: Date;
  createdAt?: Date;
}

interface ActivityCreationAttributes extends Optional<ActivityAttributes, 'id' | 'contactId' | 'companyId' | 'dealId' | 'taskId' | 'emailId' | 'description' | 'metadata' | 'createdAt'> {}

class Activity extends Model<ActivityAttributes, ActivityCreationAttributes> implements ActivityAttributes {
  public id!: string;
  public type!: ActivityType;
  public contactId!: string | null;
  public companyId!: string | null;
  public dealId!: string | null;
  public taskId!: string | null;
  public emailId!: string | null;
  public createdBy!: string;
  public description!: string | null;
  public metadata!: Record<string, any> | null;
  public timestamp!: Date;
  public readonly createdAt!: Date;
}

Activity.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['email', 'call', 'meeting', 'note', 'task', 'created', 'updated', 'deleted', 'stage_changed', 'status_changed', 'assigned', 'comment']],
      },
    },
    contactId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'contact_id',
      references: {
        model: 'contacts',
        key: 'id',
      },
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'company_id',
      references: {
        model: 'companies',
        key: 'id',
      },
    },
    dealId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'deal_id',
      references: {
        model: 'deals',
        key: 'id',
      },
    },
    taskId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'task_id',
      references: {
        model: 'tasks',
        key: 'id',
      },
    },
    emailId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'email_id',
      references: {
        model: 'emails',
        key: 'id',
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
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
