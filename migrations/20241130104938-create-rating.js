'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rating', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      productId: {
        type: Sequelize.STRING
      },
      rate: {
        type: Sequelize.FLOAT,
        defaultValue: 0
      },
      count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      sum: {
        type: Sequelize.FLOAT,
        defaultValue: 0
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('rating');
  }
};