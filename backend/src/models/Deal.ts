import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type DealStage = 'discovery' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';

interface DealAttributes {
  id: string;
  companyId: string | null;
  contactId: string | null;
  name: string;
  amount: number | null;
  stage: DealStage;
  closeDate: Date | null;
  probability: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DealCreationAttributes extends Optional<DealAttributes, 'id' | 'companyId' | 'contactId' | 'amount' | 'closeDate' | 'probability' | 'createdAt' | 'updatedAt'> {}

class Deal extends Model<DealAttributes, DealCreationAttributes> implements DealAttributes {
  public id!: string;
  public companyId!: string | null;
  public contactId!: string | null;
  public name!: string;
  public amount!: number | null;
  public stage!: DealStage;
  public closeDate!: Date | null;
  public probability!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Deal.init(
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
    contactId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'contact_id',
      references: {
        model: 'contacts',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    stage: {
      type: DataTypes.ENUM('discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost'),
      allowNull: false,
      defaultValue: 'discovery',
    },
    closeDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'close_date',
    },
    probability: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
    },
  },
  {
    sequelize,
    tableName: 'deals',
    modelName: 'Deal',
  }
);

export default Deal;
