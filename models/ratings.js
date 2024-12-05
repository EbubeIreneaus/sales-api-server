'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ratings extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      ratings.belongsTo(models.Products)
      ratings.hasOne(models.Users, {
        as: 'user'
      })
    }
  }
  ratings.init({
    productId: DataTypes.STRING,
    rate: DataTypes.INTEGER,
    userId: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Ratings',
    tableName: 'ratings',
    freezeTableName: true
  });
  return ratings;
};