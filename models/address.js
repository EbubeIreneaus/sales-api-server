'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class address extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      address.belongsTo(models.Users, {
        foreignKey: 'userId',
        as: 'user'
      }),

      address.belongsTo(models.Sales)
    }
  }
  address.init({
    userId: DataTypes.STRING,
    country: DataTypes.STRING,
    city: DataTypes.STRING,
    zip: DataTypes.INTEGER,
    state: DataTypes.STRING,
    address1: DataTypes.STRING,
    address2: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Address',
    timestamps: false,
    freezeTableName: true,
    tableName: 'addresses'
  });
  return address;
};