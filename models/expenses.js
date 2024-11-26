"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class expenses extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      expenses.belongsTo(models.Users, {
        foreignKey: 'userId',
        as: 'user'
      })
    }
  }
  expenses.init(
    {
      category: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      amount: { type: DataTypes.INTEGER, allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      desc: { type: DataTypes.STRING, allowNull: false },
    },
    {
      sequelize,
      modelName: "Expenses",
      timestamps: true,
      updatedAt: false,
      freezeTableName: true,
      tableName: 'expenses'
    }
  );
  return expenses;
};
