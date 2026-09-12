import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ProductoCompra = sequelize.define('ProductoCompra', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  nombre: { type: DataTypes.STRING(160), allowNull: false },
  cantidad: { type: DataTypes.STRING(60), allowNull: false, defaultValue: '1' },
  categoria: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'Otros' },
  comprado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  automatico: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  usuarioId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }
}, {
  tableName: 'lista_compra',
  timestamps: true,
  createdAt: 'creadoEn',
  updatedAt: 'actualizadoEn'
});

export default ProductoCompra;
