import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Comida = sequelize.define('Comida', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  fecha: { type: DataTypes.DATEONLY, allowNull: false },
  hora: { type: DataTypes.TIME, allowNull: false },
  nombre: { type: DataTypes.STRING(120), allowNull: false },
  tipo: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'comida' },
  icono: { type: DataTypes.STRING(16), allowNull: true },
  modo: { type: DataTypes.ENUM('receta', 'rapida'), allowNull: false },
  ingredientes: { type: DataTypes.JSON, allowNull: true },
  usuarioId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  recetaId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true }
}, {
  tableName: 'comidas',
  timestamps: true,
  createdAt: 'creadoEn',
  updatedAt: 'actualizadoEn'
});

export default Comida;
