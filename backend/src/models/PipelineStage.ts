import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface PipelineStageAttributes {
  id: string;
  pipelineId: string;
  name: string;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PipelineStageCreationAttributes extends Optional<PipelineStageAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class PipelineStage extends Model<PipelineStageAttributes, PipelineStageCreationAttributes> implements PipelineStageAttributes {
  public id!: string;
  public pipelineId!: string;
  public name!: string;
  public sortOrder!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PipelineStage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'sort_order',
    },
  },
  {
    sequelize,
    tableName: 'pipeline_stages',
    modelName: 'PipelineStage',
  }
);

export default PipelineStage;
