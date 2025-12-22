import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';

interface TaskAttributes {
  id: string;
  contactId: string | null;
  dealId: string | null;
  assignedTo: string | null;
  name: string;
  dueDate: Date | null;
  priority: TaskPriority;
  status: TaskStatus;
  description: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TaskCreationAttributes extends Optional<TaskAttributes, 'id' | 'contactId' | 'dealId' | 'assignedTo' | 'dueDate' | 'description' | 'createdAt' | 'updatedAt'> {}

class Task extends Model<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
  public id!: string;
  public contactId!: string | null;
  public dealId!: string | null;
  public assignedTo!: string | null;
  public name!: string;
  public dueDate!: Date | null;
  public priority!: TaskPriority;
  public status!: TaskStatus;
  public description!: string | null;
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
    assignedTo: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'assigned_to',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'due_date',
    },
    priority: {
      type: DataTypes.ENUM('high', 'medium', 'low'),
      allowNull: false,
      defaultValue: 'medium',
    },
    status: {
      type: DataTypes.ENUM('todo', 'in_progress', 'completed'),
      allowNull: false,
      defaultValue: 'todo',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'tasks',
    modelName: 'Task',
  }
);

export default Task;
