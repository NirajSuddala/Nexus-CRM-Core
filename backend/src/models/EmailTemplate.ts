import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface EmailTemplateAttributes {
  id: string;
  name: string;
  subjectTemplate: string;
  bodyTemplate: string;
  variables: string[] | null;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface EmailTemplateCreationAttributes extends Optional<EmailTemplateAttributes, 'id' | 'variables' | 'createdAt' | 'updatedAt'> {}

class EmailTemplate extends Model<EmailTemplateAttributes, EmailTemplateCreationAttributes> implements EmailTemplateAttributes {
  public id!: string;
  public name!: string;
  public subjectTemplate!: string;
  public bodyTemplate!: string;
  public variables!: string[] | null;
  public createdBy!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

EmailTemplate.init(
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
    subjectTemplate: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'subject_template',
    },
    bodyTemplate: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'body_template',
    },
    variables: {
      type: DataTypes.JSONB,
      allowNull: true,
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
  },
  {
    sequelize,
    tableName: 'email_templates',
    modelName: 'EmailTemplate',
  }
);

export default EmailTemplate;
