import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ShoppingItem = sequelize.define('ShoppingItem', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  nombre: { type: DataTypes.STRING(160), allowNull: false },
  cantidad: { type: DataTypes.STRING(60), allowNull: false, defaultValue: '1' },
  categoria: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'Otros' },
  comprado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  automatico: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
}, {
  tableName: 'shopping_items',
  timestamps: true
});

export default ShoppingItem;
