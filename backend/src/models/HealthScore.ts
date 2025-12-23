import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type RiskLevel = 'at_risk' | 'caution' | 'good' | 'excellent';

interface HealthScoreAttributes {
  id: string;
  companyId: string | null;
  contactId: string | null;
  score: number;
  npsScore: number | null;
  csatScore: number | null;
  engagementScore: number | null;
  riskLevel: RiskLevel;
  calculatedAt: Date;
  updatedAt?: Date;
}

interface HealthScoreCreationAttributes extends Optional<HealthScoreAttributes, 'id' | 'companyId' | 'contactId' | 'npsScore' | 'csatScore' | 'engagementScore' | 'updatedAt'> {}

class HealthScore extends Model<HealthScoreAttributes, HealthScoreCreationAttributes> implements HealthScoreAttributes {
  public id!: string;
  public companyId!: string | null;
  public contactId!: string | null;
  public score!: number;
  public npsScore!: number | null;
  public csatScore!: number | null;
  public engagementScore!: number | null;
  public riskLevel!: RiskLevel;
  public calculatedAt!: Date;
  public readonly updatedAt!: Date;
}

HealthScore.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    contactId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'contact_id',
      references: {
        model: 'contacts',
        key: 'id',
      },
    },
    score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
      },
    },
    npsScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'nps_score',
    },
    csatScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'csat_score',
    },
    engagementScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'engagement_score',
    },
    riskLevel: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'risk_level',
      validate: {
        isIn: [['at_risk', 'caution', 'good', 'excellent']],
      },
    },
    calculatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'calculated_at',
    },
  },
  {
    sequelize,
    tableName: 'health_scores',
    modelName: 'HealthScore',
    createdAt: false,
  }
);

export default HealthScore;
