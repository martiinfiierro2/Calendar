import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Usuario = sequelize.define('Usuario', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  nombre: { type: DataTypes.STRING(80), allowNull: false },
  email: { type: DataTypes.STRING(160), allowNull: false, unique: true },
  hashContrasena: { type: DataTypes.STRING(255), allowNull: false },
  recordatorios: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  cuentaId: { type: DataTypes.INTEGER, allowNull: false },
  rol: {
    type: DataTypes.ENUM('propietario', 'miembro'),
    allowNull: false,
    defaultValue: 'propietario'
  }
}, {
  tableName: 'usuarios',
  timestamps: true,
  createdAt: 'creadoEn',
  updatedAt: 'actualizadoEn'
});

export default Usuario;
