'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(t => {
      return Promise.all([
        queryInterface.addColumn('addresses', 'salesId', {type: Sequelize.INTEGER}, {transaction: t}),
        queryInterface.addColumn('addresses', 'phone1', {type: Sequelize.INTEGER}, {transaction: t}),
        queryInterface.addColumn('addresses', 'phone2', {type: Sequelize.INTEGER}, {transaction: t}),
        queryInterface.removeColumn('addresses', 'createdAt', {transaction: t}),
        queryInterface.removeColumn('addresses', 'updatedAt', {transaction: t})
      ])
    })

  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    return Promise.all([
      queryInterface.removeColumn('addresses', 'salesId'),
        queryInterface.removeColumn('addresses', 'phone1'),
        queryInterface.removeColumn('addresses', 'phone2'),
        queryInterface.addColumn('addresses', 'createdAt'),
        queryInterface.addColumn('addresses', 'updatedAt')
    ])
  }
};
