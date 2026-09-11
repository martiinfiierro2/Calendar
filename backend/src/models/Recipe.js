import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Recipe = sequelize.define('Recipe', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  nombre: { type: DataTypes.STRING(120), allowNull: false },
  categoria: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'Otros' },
  tiempo: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 30 },
  raciones: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 2 },
  dificultad: { type: DataTypes.ENUM('Fácil', 'Media', 'Difícil'), allowNull: false, defaultValue: 'Fácil' },
  favorito: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  imagen: { type: DataTypes.TEXT, allowNull: true },
  ingredientes: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
  pasos: { type: DataTypes.JSON, allowNull: false, defaultValue: [] }
}, {
  tableName: 'recipes',
  timestamps: true
});

export default Recipe;
