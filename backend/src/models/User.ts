import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';

export type UserRole = 'admin' | 'sales_rep';

interface UserAttributes {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  resetToken: string | null;
  resetTokenExpires: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'resetToken' | 'resetTokenExpires' | 'createdAt' | 'updatedAt'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public passwordHash!: string;
  public fullName!: string;
  public role!: UserRole;
  public resetToken!: string | null;
  public resetTokenExpires!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }

  public toJSON(): Omit<UserAttributes, 'passwordHash' | 'resetToken' | 'resetTokenExpires'> {
    const values = { ...this.get() };
    delete (values as any).passwordHash;
    delete (values as any).resetToken;
    delete (values as any).resetTokenExpires;
    return values as Omit<UserAttributes, 'passwordHash' | 'resetToken' | 'resetTokenExpires'>;
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
    fullName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'full_name',
    },
    role: {
      type: DataTypes.ENUM('admin', 'sales_rep'),
      allowNull: false,
      defaultValue: 'sales_rep',
    },
    resetToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'reset_token',
    },
    resetTokenExpires: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'reset_token_expires',
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
