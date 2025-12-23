import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type SurveyType = 'NPS' | 'CSAT' | 'CES' | 'custom';
export type SurveyStatus = 'draft' | 'active' | 'closed';

interface SurveyAttributes {
  id: string;
  name: string;
  type: SurveyType;
  questions: Record<string, any>;
  createdBy: string;
  status: SurveyStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SurveyCreationAttributes extends Optional<SurveyAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Survey extends Model<SurveyAttributes, SurveyCreationAttributes> implements SurveyAttributes {
  public id!: string;
  public name!: string;
  public type!: SurveyType;
  public questions!: Record<string, any>;
  public createdBy!: string;
  public status!: SurveyStatus;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Survey.init(
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
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['NPS', 'CSAT', 'CES', 'custom']],
      },
    },
    questions: {
      type: DataTypes.JSONB,
      allowNull: false,
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
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'draft',
      validate: {
        isIn: [['draft', 'active', 'closed']],
      },
    },
  },
  {
    sequelize,
    tableName: 'surveys',
    modelName: 'Survey',
  }
);

export default Survey;
