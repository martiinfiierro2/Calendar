import sequelize from '../config/database.js';
import Cuenta from './Account.js';
import InvitacionCuenta from './AccountInvitation.js';
import Usuario from './User.js';
import Receta from './Recipe.js';
import Comida from './Meal.js';
import ProductoCompra from './ShoppingItem.js';
import Consumo from './Consumption.js';

Cuenta.hasMany(Usuario, { foreignKey: 'cuentaId', as: 'usuarios', onDelete: 'RESTRICT' });
Usuario.belongsTo(Cuenta, { foreignKey: 'cuentaId', as: 'cuenta' });

Cuenta.hasMany(InvitacionCuenta, { foreignKey: 'cuentaId', as: 'invitaciones', onDelete: 'CASCADE' });
InvitacionCuenta.belongsTo(Cuenta, { foreignKey: 'cuentaId', as: 'cuenta' });
Usuario.hasMany(InvitacionCuenta, { foreignKey: 'invitadoPor', as: 'invitacionesEnviadas', onDelete: 'CASCADE' });
InvitacionCuenta.belongsTo(Usuario, { foreignKey: 'invitadoPor', as: 'invitador' });

Cuenta.hasMany(Receta, { foreignKey: 'cuentaId', onDelete: 'CASCADE' });
Receta.belongsTo(Cuenta, { foreignKey: 'cuentaId' });

Cuenta.hasMany(Comida, { foreignKey: 'cuentaId', onDelete: 'CASCADE' });
Comida.belongsTo(Cuenta, { foreignKey: 'cuentaId' });

Receta.hasMany(Comida, { foreignKey: 'recetaId', onDelete: 'SET NULL' });
Comida.belongsTo(Receta, { foreignKey: 'recetaId' });

Cuenta.hasMany(ProductoCompra, { foreignKey: 'cuentaId', onDelete: 'CASCADE' });
ProductoCompra.belongsTo(Cuenta, { foreignKey: 'cuentaId' });

Cuenta.hasMany(Consumo, { foreignKey: 'cuentaId', onDelete: 'CASCADE' });
Consumo.belongsTo(Cuenta, { foreignKey: 'cuentaId' });

Comida.hasMany(Consumo, { foreignKey: 'comidaId', onDelete: 'SET NULL' });
Consumo.belongsTo(Comida, { foreignKey: 'comidaId' });

Receta.hasMany(Consumo, { foreignKey: 'recetaId', onDelete: 'SET NULL' });
Consumo.belongsTo(Receta, { foreignKey: 'recetaId' });

export { sequelize, Cuenta, InvitacionCuenta, Usuario, Receta, Comida, ProductoCompra, Consumo };
