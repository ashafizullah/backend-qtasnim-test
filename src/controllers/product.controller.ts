import { CreateProductInput, FilterQueryInput, ParamsInput, UpdateProductInput } from '../schemas/product.schema';
import { Request, Response } from 'express';
import { Op } from 'sequelize';
import ProductModel from '../models/product.model';
import ProductTypeModel from '../models/productType.model';

export const createProduct = async (req: Request<object, object, CreateProductInput>, res: Response) => {
  try {
    const { productName, stock, price, productTypeId } = req.body;

		if(!productTypeId) {
			return res.status(400).json({
				status: 'failed',
				message: 'Product type is required',
			});
		}

		const productType = await ProductTypeModel.findByPk(productTypeId);
		if (!productType) {
			return res.status(404).json({
				status: 'failed',
				message: 'Product type not found',
			});
		}

    const product = await ProductModel.create({
      productName,
      stock,
      price,
      productTypeId,
    });

    res.status(201).json({
      status: 'success',
      data: product,
    });
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        status: 'failed',
        message: 'Product already exist',
      });
    }

    res.status(500).json({
      status: 'failed',
      message: error.message,
    });
  }
};

export const updateProduct = async (
  req: Request<UpdateProductInput['params'], object, UpdateProductInput['body']>,
  res: Response,
) => {
  try {
    const result = await ProductModel.update(
      { ...req.body, updatedAt: Date.now() },
      {
        where: {
          id: req.params.productId,
        },
      },
    );

    if (result[0] === 0) {
      return res.status(404).json({
        status: 'failed',
        message: 'Product not found',
      });
    }

    const product = await ProductModel.findByPk(req.params.productId);

    res.status(200).json({
      status: 'success',
      data: product,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'failed',
      message: error.message,
    });
  }
};

export const findProduct = async (req: Request<ParamsInput>, res: Response) => {
  try {
    const product = await ProductModel.findByPk(req.params.productId);

    if (!product) {
      return res.status(404).json({
        status: 'failed',
        message: 'Product not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: product,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'failed',
      message: error.message,
    });
  }
};

export const findAllProduct = async (req: Request<object, object, object, FilterQueryInput>, res: Response) => {
  try {
    const page = parseInt(`${req.query.page || 1}`);
    const limit = parseInt(`${req.query.limit || 10}`);
    const skip = (page - 1) * limit;

    const productName = req.query.productName;
    const productTypeId = req.query.productTypeId;
    const sortBy = req.query.sortBy ? req.query.sortBy : 'createdAt';
    const orderBy = req.query.orderBy ? req.query.orderBy : 'DESC';

    const queryOptions = {
      where: {
        ...(productName && {
          productName: {
            [Op.like]: `%${productName}%`,
          },
        }),
        ...(productTypeId && {
          productTypeId: {
            [Op.eq]: productTypeId,
          },
        }),
      },
      limit,
      offset: skip,
    };

    const products: any = await ProductModel.findAll({
      ...queryOptions,
      include: [
        {
          model: ProductTypeModel,
          as: 'productType',
          attributes: ['name'],
        },
      ],
      order: [[sortBy, orderBy]],
    });

    const totalProducts = await ProductModel.count({
      where: {
        ...(productName && {
          productName: {
            [Op.like]: `%${productName}%`,
          },
        }),
        ...(productTypeId && {
          productTypeId: {
            [Op.eq]: productTypeId,
          },
        }),
      },
    });

    const totalPages = Math.ceil(totalProducts / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    res.status(200).json({
      status: 'success',
      results: products.length,
      totalResults: totalProducts,
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

export const deleteProduct = async (req: Request<ParamsInput>, res: Response) => {
  try {
    const result = await ProductModel.destroy({
      where: { id: req.params.productId },
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
