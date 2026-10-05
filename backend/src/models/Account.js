import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Cuenta = sequelize.define('Cuenta', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  tipo: {
    type: DataTypes.ENUM('individual', 'grupal'),
    allowNull: false,
    defaultValue: 'individual'
  }
}, {
  tableName: 'cuentas',
  timestamps: true,
  createdAt: 'creadoEn',
  updatedAt: 'actualizadoEn'
});

export default Cuenta;
