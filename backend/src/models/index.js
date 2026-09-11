import sequelize from '../config/database.js';
import User from './User.js';
import Recipe from './Recipe.js';
import Meal from './Meal.js';
import ShoppingItem from './ShoppingItem.js';
import Profile from './Profile.js';

// Relaciones principales de la aplicación.
User.hasMany(Recipe, { foreignKey: 'userId', onDelete: 'CASCADE' });
Recipe.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Meal, { foreignKey: 'userId', onDelete: 'CASCADE' });
Meal.belongsTo(User, { foreignKey: 'userId' });

Recipe.hasMany(Meal, { foreignKey: 'recipeId', onDelete: 'SET NULL' });
Meal.belongsTo(Recipe, { foreignKey: 'recipeId' });

User.hasMany(ShoppingItem, { foreignKey: 'userId', onDelete: 'CASCADE' });
ShoppingItem.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(Profile, { foreignKey: 'userId', onDelete: 'CASCADE' });
Profile.belongsTo(User, { foreignKey: 'userId' });

export { sequelize, User, Recipe, Meal, ShoppingItem, Profile };
