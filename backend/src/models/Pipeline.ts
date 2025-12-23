import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type PipelineType = 'sales' | 'onboarding' | 'delivery';

interface PipelineAttributes {
  id: string;
  name: string;
  type: PipelineType;
  companyId: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PipelineCreationAttributes extends Optional<PipelineAttributes, 'id' | 'companyId' | 'createdAt' | 'updatedAt'> {}

class Pipeline extends Model<PipelineAttributes, PipelineCreationAttributes> implements PipelineAttributes {
  public id!: string;
  public name!: string;
  public type!: PipelineType;
  public companyId!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Pipeline.init(
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
        isIn: [['sales', 'onboarding', 'delivery']],
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
  },
  {
    sequelize,
    tableName: 'pipelines',
    modelName: 'Pipeline',
  }
);

export default Pipeline;
