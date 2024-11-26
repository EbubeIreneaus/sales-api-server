'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Notifications extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Notifications.belongsToMany(models.Users, {
        through: models.NotificationViewers,
        foreignKey: 'notificationId',
        as: 'viewers',
        otherKey: 'userId'
      })
    }
  }
  Notifications.init({
    subject: DataTypes.STRING,
    desc: DataTypes.STRING,
    onlyAdmin: DataTypes.BOOLEAN,
    staff: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Notifications',
    timestamps: true,
    updatedAt: false,
    freezeTableName: true,
    tableName: 'notification'
  });
  return Notifications;
};