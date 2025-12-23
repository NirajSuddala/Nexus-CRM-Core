import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type CompanyLifecycleStage = 'lead' | 'customer' | 'evangelist';

interface CompanyAttributes {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  size: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  lifecycleStage: CompanyLifecycleStage | null;
  customFields: Record<string, any> | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CompanyCreationAttributes extends Optional<CompanyAttributes, 'id' | 'website' | 'industry' | 'size' | 'phone' | 'address' | 'city' | 'state' | 'country' | 'lifecycleStage' | 'customFields' | 'createdAt' | 'updatedAt'> {}

class Company extends Model<CompanyAttributes, CompanyCreationAttributes> implements CompanyAttributes {
  public id!: string;
  public name!: string;
  public website!: string | null;
  public industry!: string | null;
  public size!: string | null;
  public phone!: string | null;
  public address!: string | null;
  public city!: string | null;
  public state!: string | null;
  public country!: string | null;
  public lifecycleStage!: CompanyLifecycleStage | null;
  public customFields!: Record<string, any> | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Company.init(
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
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    industry: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    size: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    lifecycleStage: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'lifecycle_stage',
      validate: {
        isIn: [['lead', 'customer', 'evangelist']],
      },
    },
    customFields: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'custom_fields',
    },
  },
  {
    sequelize,
    tableName: 'companies',
    modelName: 'Company',
  }
);

export default Company;
