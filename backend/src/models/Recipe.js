import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Receta = sequelize.define('Receta', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  nombre: { type: DataTypes.STRING(120), allowNull: false },
  categoria: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'Otros' },
  tiempo: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 30 },
  raciones: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 2 },
  dificultad: { type: DataTypes.ENUM('Fácil', 'Media', 'Difícil'), allowNull: false, defaultValue: 'Fácil' },
  favorito: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  imagen: { type: DataTypes.TEXT, allowNull: true },
  ingredientes: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
  pasos: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
  usuarioId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }
}, {
  tableName: 'recetas',
  timestamps: true,
  createdAt: 'creadoEn',
  updatedAt: 'actualizadoEn'
});

export default Receta;
