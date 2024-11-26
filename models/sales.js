"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Sales extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Sales.hasMany(models.Sold_Products, {
        foreignKey: "salesId",
        as: 'sold_products'
      });

      Sales.belongsTo(models.Users, {
        foreignKey: 'userId',
        as: 'user'
      })
    }
  }
  Sales.init(
    {
      salesId: {
        allowNull: false,
        autoIncrement: false,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },

      userId: {
        type: DataTypes.STRING,
      },
      paid: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      cash: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      website: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      delivered: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    },
    {
      sequelize,
      modelName: "Sales",
      timestamps: true,
      updatedAt: false,
      freezeTableName: true,
      tableName: 'sales'
      
    }
  );
  // Sales.removeAttribute('id')
  return Sales;
};
