import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'open' | 'in_progress' | 'completed';

interface TaskAttributes {
  id: string;
  title: string;
  description: string | null;
  dealId: string | null;
  contactId: string | null;
  assignedTo: string | null;
  createdBy: string;
  dueDate: Date | null;
  priority: TaskPriority;
  status: TaskStatus;
  completedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TaskCreationAttributes extends Optional<TaskAttributes, 'id' | 'description' | 'dealId' | 'contactId' | 'assignedTo' | 'dueDate' | 'completedAt' | 'createdAt' | 'updatedAt'> {}

class Task extends Model<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
  public id!: string;
  public title!: string;
  public description!: string | null;
  public dealId!: string | null;
  public contactId!: string | null;
  public assignedTo!: string | null;
  public createdBy!: string;
  public dueDate!: Date | null;
  public priority!: TaskPriority;
  public status!: TaskStatus;
  public completedAt!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Task.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    contactId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'contact_id',
      references: {
        model: 'contacts',
        key: 'id',
      },
    },
    assignedTo: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'assigned_to',
      references: {
        model: 'users',
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
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'due_date',
    },
    priority: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'medium',
      validate: {
        isIn: [['low', 'medium', 'high']],
      },
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'open',
      validate: {
        isIn: [['open', 'in_progress', 'completed']],
      },
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at',
    },
  },
  {
    sequelize,
    tableName: 'tasks',
    modelName: 'Task',
  }
);

export default Task;
