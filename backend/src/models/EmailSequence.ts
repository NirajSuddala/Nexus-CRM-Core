import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type EmailSequenceStatus = 'draft' | 'active' | 'paused' | 'completed';
export type EmailSequenceTrigger = 'onboarding_start' | 'deal_won' | 'project_start' | 'manual' | 'survey_response' | 'milestone_complete';

interface EmailSequenceAttributes {
  id: string;
  name: string;
  description: string | null;
  trigger: EmailSequenceTrigger;
  status: EmailSequenceStatus;
  companyId: string | null;
  createdBy: string;
  metadata: Record<string, any> | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface EmailSequenceCreationAttributes extends Optional<EmailSequenceAttributes, 'id' | 'description' | 'companyId' | 'metadata' | 'createdAt' | 'updatedAt'> {}

class EmailSequence extends Model<EmailSequenceAttributes, EmailSequenceCreationAttributes> implements EmailSequenceAttributes {
  public id!: string;
  public name!: string;
  public description!: string | null;
  public trigger!: EmailSequenceTrigger;
  public status!: EmailSequenceStatus;
  public companyId!: string | null;
  public createdBy!: string;
  public metadata!: Record<string, any> | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

EmailSequence.init(
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    trigger: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['onboarding_start', 'deal_won', 'project_start', 'manual', 'survey_response', 'milestone_complete']],
      },
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'draft',
      validate: {
        isIn: [['draft', 'active', 'paused', 'completed']],
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
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'created_by',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'email_sequences',
    modelName: 'EmailSequence',
  }
);

export default EmailSequence;
