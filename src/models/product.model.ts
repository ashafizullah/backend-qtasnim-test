import { sequelize, DataTypes } from '../config/db';
import ProductTypeModel from './productType.model';

const ProductModel = sequelize.define('product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  productName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  price: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  productTypeId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: ProductTypeModel,
      key: 'id',
    },
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

ProductModel.belongsTo(ProductTypeModel, { foreignKey: 'productTypeId', as: 'productType', onDelete: 'CASCADE' });

export default ProductModel;
