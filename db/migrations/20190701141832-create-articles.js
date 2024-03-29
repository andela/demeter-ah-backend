module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('Articles', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    title: {
      type: Sequelize.STRING,
    },
    description: {
      type: Sequelize.TEXT,
    },
    slug: {
      type: Sequelize.STRING,
    },
    body: {
      type: Sequelize.TEXT,
    },
    image: {
      type: Sequelize.STRING,
    },
    authorId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      required: true,
      references: {
        model: 'Users',
        key: 'id',
        as: 'author',
      },
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
  }),
  down: queryInterface => queryInterface.dropTable('Articles'),
};
