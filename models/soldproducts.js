'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class soldProducts extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      soldProducts.belongsTo(models.Products, {
        foreignKey: 'productId',
        as: 'product'
      }),
      soldProducts.belongsTo(models.Sales, {
        foreignKey: 'salesId',
       
      })
    }
  }
  soldProducts.init({
    salesId: DataTypes.INTEGER,
    productId: DataTypes.INTEGER,
    amount: DataTypes.INTEGER,
    quantity: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Sold_Products',
    timestamps: false,
    freezeTableName: true,
    tableName: 'sold_products'
  });
  return soldProducts;
};