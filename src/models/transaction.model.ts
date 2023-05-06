import { sequelize, DataTypes } from '../config/db';
import ProductModel from './product.model';

const TransactionModel = sequelize.define('transaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  buyerName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: ProductModel,
      key: 'id',
    },
  },
  amountSold: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  totalPrice: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  transactionDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
});

TransactionModel.belongsTo(ProductModel, { foreignKey: 'productId', as: 'product', onDelete: 'CASCADE' });

export default TransactionModel;
