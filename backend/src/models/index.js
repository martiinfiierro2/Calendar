import sequelize from '../config/database.js';
import Usuario from './User.js';
import Receta from './Recipe.js';
import Comida from './Meal.js';
import ProductoCompra from './ShoppingItem.js';
import Perfil from './Profile.js';

// Relaciones principales de la aplicación.
Usuario.hasMany(Receta, { foreignKey: 'usuarioId', onDelete: 'CASCADE' });
Receta.belongsTo(Usuario, { foreignKey: 'usuarioId' });

Usuario.hasMany(Comida, { foreignKey: 'usuarioId', onDelete: 'CASCADE' });
Comida.belongsTo(Usuario, { foreignKey: 'usuarioId' });

Receta.hasMany(Comida, { foreignKey: 'recetaId', onDelete: 'SET NULL' });
Comida.belongsTo(Receta, { foreignKey: 'recetaId' });

Usuario.hasMany(ProductoCompra, { foreignKey: 'usuarioId', onDelete: 'CASCADE' });
ProductoCompra.belongsTo(Usuario, { foreignKey: 'usuarioId' });

Usuario.hasOne(Perfil, { foreignKey: 'usuarioId', onDelete: 'CASCADE' });
Perfil.belongsTo(Usuario, { foreignKey: 'usuarioId' });

export { sequelize, Usuario, Receta, Comida, ProductoCompra, Perfil };
