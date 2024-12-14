'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class favorite extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association 
      favorite.belongsTo(models.Users)
      favorite.belongsTo(models.Products)
    }
  }
  favorite.init({
    userId: DataTypes.INTEGER,
    productId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Favorite',
    tableName: 'favorites',
    freezeTableName: true,
    timestamps: false
  });
  return favorite;
};