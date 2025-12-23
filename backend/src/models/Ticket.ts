import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type TicketType = 'bug' | 'feature_request' | 'support' | 'change_request' | 'question';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'waiting_on_client' | 'resolved' | 'closed';

interface TicketAttributes {
  id: string;
  title: string;
  description: string | null;
  type: TicketType;
  priority: TicketPriority;
  status: TicketStatus;
  companyId: string | null;
  contactId: string | null;
  projectId: string | null;
  assignedTo: string | null;
  createdBy: string;
  resolvedAt: Date | null;
  closedAt: Date | null;
  dueDate: Date | null;
  metadata: Record<string, any> | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TicketCreationAttributes extends Optional<TicketAttributes, 'id' | 'description' | 'companyId' | 'contactId' | 'projectId' | 'assignedTo' | 'resolvedAt' | 'closedAt' | 'dueDate' | 'metadata' | 'createdAt' | 'updatedAt'> {}

class Ticket extends Model<TicketAttributes, TicketCreationAttributes> implements TicketAttributes {
  public id!: string;
  public title!: string;
  public description!: string | null;
  public type!: TicketType;
  public priority!: TicketPriority;
  public status!: TicketStatus;
  public companyId!: string | null;
  public contactId!: string | null;
  public projectId!: string | null;
  public assignedTo!: string | null;
  public createdBy!: string;
  public resolvedAt!: Date | null;
  public closedAt!: Date | null;
  public dueDate!: Date | null;
  public metadata!: Record<string, any> | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Ticket.init(
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
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['bug', 'feature_request', 'support', 'change_request', 'question']],
      },
    },
    priority: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'medium',
      validate: {
        isIn: [['low', 'medium', 'high', 'urgent']],
      },
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'open',
      validate: {
        isIn: [['open', 'in_progress', 'waiting_on_client', 'resolved', 'closed']],
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
    contactId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'contact_id',
      references: {
        model: 'contacts',
        key: 'id',
      },
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'project_id',
      references: {
        model: 'projects',
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
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'resolved_at',
    },
    closedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'closed_at',
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'due_date',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'tickets',
    modelName: 'Ticket',
  }
);

export default Ticket;
