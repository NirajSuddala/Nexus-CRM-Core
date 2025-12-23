import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type ContactLifecycleStage = 'lead' | 'mql' | 'sql' | 'customer';

interface ContactAttributes {
  id: string;
  email: string;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  title: string | null;
  companyId: string | null;
  lifecycleStage: ContactLifecycleStage | null;
  customFields: Record<string, any> | null;
  properties: Record<string, any> | null;
  lastActivityDate: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ContactCreationAttributes extends Optional<ContactAttributes, 'id' | 'phone' | 'firstName' | 'lastName' | 'title' | 'companyId' | 'lifecycleStage' | 'customFields' | 'properties' | 'lastActivityDate' | 'createdAt' | 'updatedAt'> {}

class Contact extends Model<ContactAttributes, ContactCreationAttributes> implements ContactAttributes {
  public id!: string;
  public email!: string;
  public phone!: string | null;
  public firstName!: string | null;
  public lastName!: string | null;
  public title!: string | null;
  public companyId!: string | null;
  public lifecycleStage!: ContactLifecycleStage | null;
  public customFields!: Record<string, any> | null;
  public properties!: Record<string, any> | null;
  public lastActivityDate!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public get fullName(): string {
    return [this.firstName, this.lastName].filter(Boolean).join(' ') || this.email;
  }
}

Contact.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    firstName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'first_name',
    },
    lastName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'last_name',
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: true,
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
    lifecycleStage: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'lifecycle_stage',
      validate: {
        isIn: [['lead', 'mql', 'sql', 'customer']],
      },
    },
    customFields: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'custom_fields',
    },
    properties: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    lastActivityDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_activity_date',
    },
  },
  {
    sequelize,
    tableName: 'contacts',
    modelName: 'Contact',
  }
);

export default Contact;
