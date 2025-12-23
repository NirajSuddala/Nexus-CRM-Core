import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';

export type UserRole = 'admin' | 'manager' | 'agent';

interface UserAttributes {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  companyId: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'firstName' | 'lastName' | 'companyId' | 'createdAt' | 'updatedAt'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public passwordHash!: string;
  public firstName!: string | null;
  public lastName!: string | null;
  public role!: UserRole;
  public companyId!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }

  public get fullName(): string {
    return [this.firstName, this.lastName].filter(Boolean).join(' ') || this.email;
  }

  public toJSON(): Omit<UserAttributes, 'passwordHash'> & { fullName: string } {
    const values = { ...this.get() };
    delete (values as any).passwordHash;
    return { ...values, fullName: this.fullName } as Omit<UserAttributes, 'passwordHash'> & { fullName: string };
  }
}

User.init(
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
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash',
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
    role: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'agent',
      validate: {
        isIn: [['admin', 'manager', 'agent']],
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
  },
  {
    sequelize,
    tableName: 'users',
    modelName: 'User',
    hooks: {
      beforeCreate: async (user) => {
        if (user.passwordHash) {
          user.passwordHash = await bcrypt.hash(user.passwordHash, 12);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('passwordHash')) {
          user.passwordHash = await bcrypt.hash(user.passwordHash, 12);
        }
      },
    },
  }
);

export default User;
