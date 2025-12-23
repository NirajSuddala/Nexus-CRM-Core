import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface SurveyResponseAttributes {
  id: string;
  surveyId: string;
  contactId: string | null;
  companyId: string | null;
  responses: Record<string, any>;
  score: number | null;
  submittedAt: Date;
  createdAt?: Date;
}

interface SurveyResponseCreationAttributes extends Optional<SurveyResponseAttributes, 'id' | 'contactId' | 'companyId' | 'score' | 'createdAt'> {}

class SurveyResponse extends Model<SurveyResponseAttributes, SurveyResponseCreationAttributes> implements SurveyResponseAttributes {
  public id!: string;
  public surveyId!: string;
  public contactId!: string | null;
  public companyId!: string | null;
  public responses!: Record<string, any>;
  public score!: number | null;
  public submittedAt!: Date;
  public readonly createdAt!: Date;
}

SurveyResponse.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    surveyId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'survey_id',
      references: {
        model: 'surveys',
        key: 'id',
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
    responses: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'submitted_at',
    },
  },
  {
    sequelize,
    tableName: 'survey_responses',
    modelName: 'SurveyResponse',
    updatedAt: false,
  }
);

export default SurveyResponse;
