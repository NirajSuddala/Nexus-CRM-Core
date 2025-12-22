import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface CompanyAttributes {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  linkedinUrl: string | null;
  revenue: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CompanyCreationAttributes extends Optional<CompanyAttributes, 'id' | 'domain' | 'industry' | 'linkedinUrl' | 'revenue' | 'createdAt' | 'updatedAt'> {}

class Company extends Model<CompanyAttributes, CompanyCreationAttributes> implements CompanyAttributes {
  public id!: string;
  public name!: string;
  public domain!: string | null;
  public industry!: string | null;
  public linkedinUrl!: string | null;
  public revenue!: number | null;
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
    domain: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    industry: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    linkedinUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'linkedin_url',
    },
    revenue: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'companies',
    modelName: 'Company',
  }
);

export default Company;
