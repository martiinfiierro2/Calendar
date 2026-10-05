import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Consumo = sequelize.define('Consumo', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  nombreProducto: { type: DataTypes.STRING(160), allowNull: false },
  cantidad: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  unidad: { type: DataTypes.STRING(20), allowNull: false },
  fecha: { type: DataTypes.DATEONLY, allowNull: false },
  hora: { type: DataTypes.TIME, allowNull: false },
  comidaNombre: { type: DataTypes.STRING(120), allowNull: false },
  cuentaId: { type: DataTypes.INTEGER, allowNull: false },
  comidaId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  recetaId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true }
}, {
  tableName: 'consumos',
  timestamps: true,
  createdAt: 'creadoEn',
  updatedAt: 'actualizadoEn'
});

export default Consumo;
