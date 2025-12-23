import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface DealAttributes {
  id: string;
  name: string;
  companyId: string | null;
  contactId: string | null;
  pipelineId: string;
  stageId: string;
  amount: number | null;
  probability: number | null;
  expectedCloseDate: Date | null;
  properties: Record<string, any> | null;
  closedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DealCreationAttributes extends Optional<DealAttributes, 'id' | 'companyId' | 'contactId' | 'amount' | 'probability' | 'expectedCloseDate' | 'properties' | 'closedAt' | 'createdAt' | 'updatedAt'> {}

class Deal extends Model<DealAttributes, DealCreationAttributes> implements DealAttributes {
  public id!: string;
  public name!: string;
  public companyId!: string | null;
  public contactId!: string | null;
  public pipelineId!: string;
  public stageId!: string;
  public amount!: number | null;
  public probability!: number | null;
  public expectedCloseDate!: Date | null;
  public properties!: Record<string, any> | null;
  public closedAt!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Deal.init(
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
    pipelineId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'pipeline_id',
      references: {
        model: 'pipelines',
        key: 'id',
      },
    },
    stageId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'stage_id',
      references: {
        model: 'pipeline_stages',
        key: 'id',
      },
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    probability: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 100,
      },
    },
    expectedCloseDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'expected_close_date',
    },
    properties: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    closedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'closed_at',
    },
  },
  {
    sequelize,
    tableName: 'deals',
    modelName: 'Deal',
  }
);

export default Deal;
