import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Cuenta = sequelize.define('Cuenta', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  tipo: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'individual',
    validate: {
      isIn: [['individual', 'grupal']]
    }
  }
}, {
  tableName: 'cuentas',
  timestamps: true,
  createdAt: 'creadoEn',
  updatedAt: 'actualizadoEn'
});

export default Cuenta;
