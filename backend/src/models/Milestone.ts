import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';

interface MilestoneAttributes {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  status: MilestoneStatus;
  dueDate: Date | null;
  completedDate: Date | null;
  sortOrder: number;
  metadata: Record<string, any> | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MilestoneCreationAttributes extends Optional<MilestoneAttributes, 'id' | 'description' | 'dueDate' | 'completedDate' | 'sortOrder' | 'metadata' | 'createdAt' | 'updatedAt'> {}

class Milestone extends Model<MilestoneAttributes, MilestoneCreationAttributes> implements MilestoneAttributes {
  public id!: string;
  public projectId!: string;
  public name!: string;
  public description!: string | null;
  public status!: MilestoneStatus;
  public dueDate!: Date | null;
  public completedDate!: Date | null;
  public sortOrder!: number;
  public metadata!: Record<string, any> | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Milestone.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'project_id',
      references: {
        model: 'projects',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'in_progress', 'completed', 'delayed', 'cancelled']],
      },
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'due_date',
    },
    completedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_date',
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'sort_order',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'milestones',
    modelName: 'Milestone',
  }
);

export default Milestone;
