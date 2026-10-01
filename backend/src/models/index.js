import sequelize from '../config/database.js';
import Usuario from './User.js';
import Receta from './Recipe.js';
import Comida from './Meal.js';
import ProductoCompra from './ShoppingItem.js';
import Consumo from './Consumption.js';

// Relaciones principales de la aplicación.
Usuario.hasMany(Receta, { foreignKey: 'usuarioId', onDelete: 'CASCADE' });
Receta.belongsTo(Usuario, { foreignKey: 'usuarioId' });

Usuario.hasMany(Comida, { foreignKey: 'usuarioId', onDelete: 'CASCADE' });
Comida.belongsTo(Usuario, { foreignKey: 'usuarioId' });

Receta.hasMany(Comida, { foreignKey: 'recetaId', onDelete: 'SET NULL' });
Comida.belongsTo(Receta, { foreignKey: 'recetaId' });

Usuario.hasMany(ProductoCompra, { foreignKey: 'usuarioId', onDelete: 'CASCADE' });
ProductoCompra.belongsTo(Usuario, { foreignKey: 'usuarioId' });

Usuario.hasMany(Consumo, { foreignKey: 'usuarioId', onDelete: 'CASCADE' });
Consumo.belongsTo(Usuario, { foreignKey: 'usuarioId' });

Comida.hasMany(Consumo, { foreignKey: 'comidaId', onDelete: 'SET NULL' });
Consumo.belongsTo(Comida, { foreignKey: 'comidaId' });

Receta.hasMany(Consumo, { foreignKey: 'recetaId', onDelete: 'SET NULL' });
Consumo.belongsTo(Receta, { foreignKey: 'recetaId' });

export { sequelize, Usuario, Receta, Comida, ProductoCompra, Consumo };
