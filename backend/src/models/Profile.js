import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Profile = sequelize.define('Profile', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  raciones: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 2 },
  dieta: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'Sin preferencias' },
  recordatorios: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  resumenSemanal: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  comprasAutomaticas: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
}, {
  tableName: 'profiles',
  timestamps: true
});

export default Profile;
