import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const InvitacionCuenta = sequelize.define('InvitacionCuenta', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  cuentaId: { type: DataTypes.INTEGER, allowNull: false },
  email: { type: DataTypes.STRING(160), allowNull: false },
  invitadoPor: { type: DataTypes.INTEGER, allowNull: false },
  estado: {
    type: DataTypes.ENUM('pendiente', 'aceptada', 'rechazada'),
    allowNull: false,
    defaultValue: 'pendiente'
  },
  token: { type: DataTypes.STRING(120), allowNull: false, unique: true },
  expiraEn: { type: DataTypes.DATE, allowNull: false }
}, {
  tableName: 'invitaciones_cuenta',
  timestamps: true,
  createdAt: 'creadoEn',
  updatedAt: 'actualizadoEn'
});

export default InvitacionCuenta;
