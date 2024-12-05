'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class users extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      users.hasOne(models.Expenses)
      users.hasOne(models.Sales)
      users.hasOne(models.Address)
      users.belongsToMany(models.Notifications, {
        through: models.NotificationViewers,
        foreignKey: 'userId',
        as: 'viewedNotifications',
        otherKey: 'notificationId'
      })
      users.belongsTo(models.Ratings, {
        foreignKey: 'userId'
      })
    }
  }
  users.init({
    firstname: DataTypes.STRING,
    lastname: DataTypes.STRING,
    username: DataTypes.STRING,
    psw: DataTypes.STRING,
    email: DataTypes.STRING,
    staff: DataTypes.BOOLEAN,
    active: DataTypes.BOOLEAN,
    admin: DataTypes.BOOLEAN,
    auth_key: DataTypes.UUID,
    profile_pics: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Users',
    timestamps: true,
    createdAt: 'joined',
    updatedAt: false,
    freezeTableName: true,
    tableName: 'users'
  });
  return users;
};