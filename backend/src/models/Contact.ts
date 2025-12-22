import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type LifecycleStage = 'lead' | 'mql' | 'sql' | 'customer';

interface ContactAttributes {
  id: string;
  companyId: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  lifecycleStage: LifecycleStage;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ContactCreationAttributes extends Optional<ContactAttributes, 'id' | 'companyId' | 'email' | 'phone' | 'jobTitle' | 'createdAt' | 'updatedAt'> {}

class Contact extends Model<ContactAttributes, ContactCreationAttributes> implements ContactAttributes {
  public id!: string;
  public companyId!: string | null;
  public fullName!: string;
  public email!: string | null;
  public phone!: string | null;
  public jobTitle!: string | null;
  public lifecycleStage!: LifecycleStage;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Contact.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    fullName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'full_name',
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    jobTitle: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'job_title',
    },
    lifecycleStage: {
      type: DataTypes.ENUM('lead', 'mql', 'sql', 'customer'),
      allowNull: false,
      defaultValue: 'lead',
      field: 'lifecycle_stage',
    },
  },
  {
    sequelize,
    tableName: 'contacts',
    modelName: 'Contact',
  }
);

export default Contact;
