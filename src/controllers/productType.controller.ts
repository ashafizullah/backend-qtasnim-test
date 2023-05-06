import {
  CreateProductTypeInput,
  FilterQueryInput,
  ParamsInput,
  UpdateProductTypeInput,
} from '../schemas/productType.schema';
import { Request, Response } from 'express';
import { Op } from 'sequelize';
import ProductTypeModel from '../models/productType.model';

export const createProductType = async (req: Request<object, object, CreateProductTypeInput>, res: Response) => {
  try {
    const { name } = req.body;

    const productType = await ProductTypeModel.create({
      name,
    });

    res.status(201).json({
      status: 'success',
      data: productType,
    });
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        status: 'failed',
        message: 'Product type already exist',
      });
    }

    res.status(500).json({
      status: 'failed',
      message: error.message,
    });
  }
};

export const updateProductType = async (
  req: Request<UpdateProductTypeInput['params'], object, UpdateProductTypeInput['body']>,
  res: Response,
) => {
  try {
    const result = await ProductTypeModel.update(
      { ...req.body, updatedAt: Date.now() },
      {
        where: {
          id: req.params.productTypeId,
        },
      },
    );

    if (result[0] === 0) {
      return res.status(404).json({
        status: 'failed',
        message: 'Product type not found',
      });
    }

    const productType = await ProductTypeModel.findByPk(req.params.productTypeId);

    res.status(200).json({
      status: 'success',
      data: productType,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'failed',
      message: error.message,
    });
  }
};

export const findProductType = async (req: Request<ParamsInput>, res: Response) => {
  try {
    const productType = await ProductTypeModel.findByPk(req.params.productTypeId);

    if (!productType) {
      return res.status(404).json({
        status: 'failed',
        message: 'Product type not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: productType,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'failed',
      message: error.message,
    });
  }
};

export const findAllProductType = async (req: Request<object, object, object, FilterQueryInput>, res: Response) => {
  try {
    const page = parseInt(`${req.query.page || 1}`);
    const limit = parseInt(`${req.query.limit || 10}`);
    const skip = (page - 1) * limit;

    console.log(skip);

    const name = req.query.name;
    const sortBy = req.query.sortBy ? req.query.sortBy : 'createdAt';
    const orderBy = req.query.orderBy ? req.query.orderBy : 'DESC';

    const queryOptions = {
      where: {
        ...(name && {
          name: {
            [Op.like]: `%${name}%`,
          },
        }),
      },
      limit,
      offset: skip,
    };

    const products: any = await ProductTypeModel.findAll({
      ...queryOptions,
      order: [[sortBy, orderBy]],
    });

    const totalProductTypes = await ProductTypeModel.count({
      where: {
        ...(name && {
          name: {
            [Op.like]: `%${name}%`,
          },
        }),
      },
    });

    const totalPages = Math.ceil(totalProductTypes / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    res.status(200).json({
      status: 'success',
      results: products.length,
      totalResults: totalProductTypes,
      currentPage: page,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      data: products,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'failed',
      message: error.message,
    });
  }
};

export const deleteProductType = async (req: Request<ParamsInput>, res: Response) => {
  try {
    const result = await ProductTypeModel.destroy({
      where: { id: req.params.productTypeId },
      force: true,
    });

    if (result === 0) {
      return res.status(404).json({
        status: 'failed',
        message: 'Product not found',
      });
    }

    res.status(204).json({
      status: 'success',
      message: 'Product deleted',
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'failed',
      message: error.message,
    });
  }
};
