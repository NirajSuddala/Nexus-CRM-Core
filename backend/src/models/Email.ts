import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface EmailAttributes {
  id: string;
  toEmail: string;
  subject: string;
  body: string;
  templateId: string | null;
  contactId: string | null;
  dealId: string | null;
  sentBy: string | null;
  sentAt: Date | null;
  openedAt: Date | null;
  clickedAt: Date | null;
  responseReceived: boolean;
  createdAt?: Date;
}

interface EmailCreationAttributes extends Optional<EmailAttributes, 'id' | 'templateId' | 'contactId' | 'dealId' | 'sentBy' | 'sentAt' | 'openedAt' | 'clickedAt' | 'responseReceived' | 'createdAt'> {}

class Email extends Model<EmailAttributes, EmailCreationAttributes> implements EmailAttributes {
  public id!: string;
  public toEmail!: string;
  public subject!: string;
  public body!: string;
  public templateId!: string | null;
  public contactId!: string | null;
  public dealId!: string | null;
  public sentBy!: string | null;
  public sentAt!: Date | null;
  public openedAt!: Date | null;
  public clickedAt!: Date | null;
  public responseReceived!: boolean;
  public readonly createdAt!: Date;
}

Email.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    toEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'to_email',
      validate: {
        isEmail: true,
      },
    },
    subject: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    templateId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'template_id',
      references: {
        model: 'email_templates',
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
    sentBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'sent_by',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'sent_at',
    },
    openedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'opened_at',
    },
    clickedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'clicked_at',
    },
    responseReceived: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'response_received',
    },
  },
  {
    sequelize,
    tableName: 'emails',
    modelName: 'Email',
    updatedAt: false,
  }
);

export default Email;
