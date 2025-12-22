import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type NoteEntityType = 'contact' | 'deal';

interface NoteAttributes {
  id: string;
  entityType: NoteEntityType;
  entityId: string;
  userId: string | null;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface NoteCreationAttributes extends Optional<NoteAttributes, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {}

class Note extends Model<NoteAttributes, NoteCreationAttributes> implements NoteAttributes {
  public id!: string;
  public entityType!: NoteEntityType;
  public entityId!: string;
  public userId!: string | null;
  public content!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Note.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    entityType: {
      type: DataTypes.ENUM('contact', 'deal'),
      allowNull: false,
      field: 'entity_type',
    },
    entityId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'entity_id',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'notes',
    modelName: 'Note',
  }
);

export default Note;
