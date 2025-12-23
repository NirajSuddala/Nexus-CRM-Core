import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type ProjectType = 'onboarding' | 'delivery' | 'implementation' | 'support';
export type ProjectStatus = 'not_started' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';

interface ProjectAttributes {
  id: string;
  name: string;
  description: string | null;
  type: ProjectType;
  status: ProjectStatus;
  companyId: string;
  contactId: string | null;
  dealId: string | null;
  pipelineId: string | null;
  stageId: string | null;
  ownerId: string | null;
  startDate: Date | null;
  targetEndDate: Date | null;
  actualEndDate: Date | null;
  progress: number;
  metadata: Record<string, any> | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProjectCreationAttributes extends Optional<ProjectAttributes, 'id' | 'description' | 'contactId' | 'dealId' | 'pipelineId' | 'stageId' | 'ownerId' | 'startDate' | 'targetEndDate' | 'actualEndDate' | 'progress' | 'metadata' | 'createdAt' | 'updatedAt'> {}

class Project extends Model<ProjectAttributes, ProjectCreationAttributes> implements ProjectAttributes {
  public id!: string;
  public name!: string;
  public description!: string | null;
  public type!: ProjectType;
  public status!: ProjectStatus;
  public companyId!: string;
  public contactId!: string | null;
  public dealId!: string | null;
  public pipelineId!: string | null;
  public stageId!: string | null;
  public ownerId!: string | null;
  public startDate!: Date | null;
  public targetEndDate!: Date | null;
  public actualEndDate!: Date | null;
  public progress!: number;
  public metadata!: Record<string, any> | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Project.init(
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
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['onboarding', 'delivery', 'implementation', 'support']],
      },
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'not_started',
      validate: {
        isIn: [['not_started', 'in_progress', 'on_hold', 'completed', 'cancelled']],
      },
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: false,
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
    dealId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'deal_id',
      references: {
        model: 'deals',
        key: 'id',
      },
    },
    pipelineId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'pipeline_id',
      references: {
        model: 'pipelines',
        key: 'id',
      },
    },
    stageId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'stage_id',
      references: {
        model: 'pipeline_stages',
        key: 'id',
      },
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'owner_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'start_date',
    },
    targetEndDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'target_end_date',
    },
    actualEndDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'actual_end_date',
    },
    progress: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'projects',
    modelName: 'Project',
  }
);

export default Project;
