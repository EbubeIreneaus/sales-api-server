'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sales', {
      salesId: {
        allowNull: false,
        autoIncrement: false,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.STRING
      },
      paid: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      cash: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      website: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      delivered: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('sales');
  }
};