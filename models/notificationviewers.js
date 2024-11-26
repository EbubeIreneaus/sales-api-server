'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class notificationViewers extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  notificationViewers.init({
    notificationId: {
      type: DataTypes.INTEGER,
      references: {
        model: sequelize.models.Notification, // The table name of the notifications model
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: sequelize.models.users, // The table name of the users model
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'NotificationViewers',
    timestamps: true,
    updatedAt: false,
    freezeTableName: true,
    tableName: 'notificationviewers'
  });
  return notificationViewers;
};