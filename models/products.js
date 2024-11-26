"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Products extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Products.hasOne(models.Sold_Products, {
        foreignKey: "productId",
      });
    }
  }
  Products.init(
    {
      name: {
        type: DataTypes.STRING,
      },
      unit_price: {
        type: DataTypes.DECIMAL,
      },
      market_price: {
        type: DataTypes.DECIMAL,
      },
      quantity: {
        type: DataTypes.INTEGER,
      },
      image: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      modelName: "Products",
      timestamps: false,
      freezeTableName: true,
      tableName: 'products'
    }
  );
  return Products;
};
