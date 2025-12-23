import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type StepType = 'email' | 'delay' | 'condition';

interface EmailSequenceStepAttributes {
  id: string;
  sequenceId: string;
  templateId: string | null;
  stepType: StepType;
  delayDays: number;
  delayHours: number;
  sortOrder: number;
  condition: Record<string, any> | null;
  metadata: Record<string, any> | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface EmailSequenceStepCreationAttributes extends Optional<EmailSequenceStepAttributes, 'id' | 'templateId' | 'delayDays' | 'delayHours' | 'sortOrder' | 'condition' | 'metadata' | 'createdAt' | 'updatedAt'> {}

class EmailSequenceStep extends Model<EmailSequenceStepAttributes, EmailSequenceStepCreationAttributes> implements EmailSequenceStepAttributes {
  public id!: string;
  public sequenceId!: string;
  public templateId!: string | null;
  public stepType!: StepType;
  public delayDays!: number;
  public delayHours!: number;
  public sortOrder!: number;
  public condition!: Record<string, any> | null;
  public metadata!: Record<string, any> | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

EmailSequenceStep.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    sequenceId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'sequence_id',
      references: {
        model: 'email_sequences',
        key: 'id',
      },
    },
    templateId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'template_id',
      references: {
        model: 'email_templates',
        key: 'id',
      },
    },
    stepType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'step_type',
      validate: {
        isIn: [['email', 'delay', 'condition']],
      },
    },
    delayDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'delay_days',
    },
    delayHours: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'delay_hours',
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'sort_order',
    },
    condition: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'email_sequence_steps',
    modelName: 'EmailSequenceStep',
  }
);

export default EmailSequenceStep;
