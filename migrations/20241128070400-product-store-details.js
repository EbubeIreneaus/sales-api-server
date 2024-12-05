"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.addColumn(
          "products",
          "store",
          {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
          },
          { transaction: t }
        ),
        queryInterface.addColumn(
          "products",
          "category",
          {
            type: Sequelize.STRING,
          },
          { transaction: t }
        ),
        queryInterface.addColumn(
          "products",
          "sub_category",
          {
            type: Sequelize.STRING,
          },
          { transaction: t }
        ),
        queryInterface.addColumn(
          "products",
          "desc",
          {
            type: Sequelize.TEXT("long"),
          },
          { transaction: t }
        ),
        queryInterface.addColumn(
          "products",
          "long_title",
          {
            type: Sequelize.STRING,
          },
          { transaction: t }
        ),
      ]);
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    return queryInterface.sequelize.transaction(t => {
      return Promise.all([
        queryInterface.removeColumn('products', 'store', {transaction: t}),
        queryInterface.removeColumn('products', 'category', {transaction: t}),
        queryInterface.removeColumn('products', 'sub_category', {transaction: t}),
        queryInterface.removeColumn('products', 'desc', {transaction: t}),
        queryInterface.removeColumn('products', 'long_title', {transaction: t})
      ])
    })
  },
};
