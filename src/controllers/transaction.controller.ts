import {
  CreateTransactionInput,
  FilterQueryInput,
  ParamsInput,
  UpdateTransactionInput,
} from '../schemas/transaction.schema';
import { Request, Response } from 'express';
import { Op } from 'sequelize';
import TransactionModel from '../models/transaction.model';
import ProductModel from '../models/product.model';
import ProductTypeModel from '../models/productType.model';

export const createTransaction = async (req: Request<object, object, CreateTransactionInput>, res: Response) => {
  try {
    const { buyerName, productId, amountSold, transactionDate } = req.body;

    const product: any = await ProductModel.findByPk(productId);

    if (!product) {
      return res.status(404).json({
        status: 'failed',
        message: 'Product not found',
      });
    }

    const totalPrice = product.price * amountSold;

		if(product.stock < amountSold) {
			return res.status(400).json({
				status: 'failed',
				message: 'Stock is not enough',
			});
		}

    const transaction = await TransactionModel.create({
      buyerName,
      productId,
      amountSold,
      totalPrice,
      transactionDate,
    });

		const updateStock = product.stock - amountSold;
		await ProductModel.update(
			{ stock: updateStock },
			{
				where: {
					id: productId,
				},
			},
		);

    res.status(201).json({
      status: 'success',
      data: transaction,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'failed',
      message: error.message,
    });
  }
};

export const updateTransaction = async (
  req: Request<UpdateTransactionInput['params'], object, UpdateTransactionInput['body']>,
  res: Response,
) => {
  try {
		const payload: any = {
			...req.body,
		}

		const oldTransaction: any = await TransactionModel.findByPk(req.params.transactionId);
		const product: any = await ProductModel.findByPk(payload.productId);
		if (!product) {
      return res.status(404).json({
        status: 'failed',
        message: 'Product not found',
      });
    }
		
		if(product.stock + oldTransaction.amountSold < payload.amountSold) {
			return res.status(400).json({
				status: 'failed',
				message: 'Stock is not enough',
			});
		}

    const totalPrice = product.price * payload.amountSold;
		payload.totalPrice = totalPrice;

    const result = await TransactionModel.update(
      { ...payload, updatedAt: Date.now() },
      {
        where: {
          id: req.params.transactionId,
        },
      },
    );

    if (result[0] === 0) {
      return res.status(404).json({
        status: 'failed',
        message: 'Transaction not found',
      });
    }

		const updateStock = product.stock + oldTransaction.amountSold - payload.amountSold;
		await ProductModel.update(
			{ stock: updateStock },
			{
				where: {
					id: payload.productId,
				},
			},
		);

    const transaction = await TransactionModel.findByPk(req.params.transactionId);

    res.status(200).json({
      status: 'success',
      data: transaction,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'failed',
      message: error.message,
    });
  }
};

export const findTransaction = async (req: Request<ParamsInput>, res: Response) => {
  try {
    const transaction = await TransactionModel.findByPk(req.params.transactionId);

    if (!transaction) {
      return res.status(404).json({
        status: 'failed',
        message: 'Transaction not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: transaction,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'failed',
      message: error.message,
    });
  }
};

export const findAllTransaction = async (req: Request<object, object, object, FilterQueryInput>, res: Response) => {
  try {
    const page = parseInt(`${req.query.page || 1}`);
    const limit = parseInt(`${req.query.limit || 10}`);
    const skip = (page - 1) * limit;

    const buyerName = req.query.buyerName;
    const productId = req.query.productId;
		const productTypeId = req.query.productTypeId;
    const sortBy = req.query.sortBy ? req.query.sortBy : 'createdAt';
    const orderBy = req.query.orderBy ? req.query.orderBy : 'DESC';
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

		const defaultOrder = [[sortBy, orderBy]];

		const transactionOrder = sortBy == 'productName' ? [[{ model: ProductModel, as: 'product' }, 'productName', orderBy]] : [];

		const order: any = sortBy == 'productName' ? [...transactionOrder] : [defaultOrder];

    const queryOptions = {
      where: {
        ...(buyerName && {
          buyerName: {
            [Op.like]: `%${buyerName}%`,
          },
        }),
        ...(productId && {
          productId: {
            [Op.eq]: productId,
          },
        }),
				...(productTypeId && {
					'$product.productType.id$': {
						[Op.eq]: productTypeId,
					},
				}),
        ...(startDate && endDate && {
          transactionDate: {
            [Op.between]: [startDate, endDate],
          },
        }),
      },
      limit,
      offset: skip,
    };

    const transactions: any = await TransactionModel.findAll({
      ...queryOptions,
      include: [
        {
          model: ProductModel,
          as: 'product',
          attributes: ['productName'],
					include: [
						{
							model: ProductTypeModel,
							as: 'productType',
							attributes: ['name'],
						},
					],
        },
      ],
      order
    });

    const totalTransactions = await TransactionModel.count({
      where: {
        ...(buyerName && {
          buyerName: {
            [Op.like]: `%${buyerName}%`,
          },
        }),
        ...(productId && {
          productId: {
            [Op.eq]: productId,
          },
        }),
        ...(startDate && endDate && {
          transactionDate: {
            [Op.between]: [startDate, endDate],
          },
        }),
      },
    });

    const totalPages = Math.ceil(totalTransactions / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    res.status(200).json({
      status: 'success',
      results: transactions.length,
      totalResults: totalTransactions,
      currentPage: page,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      data: transactions,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'failed',
      message: error.message,
    });
  }
};

export const deleteTransaction = async (req: Request<ParamsInput>, res: Response) => {
  try {
		const transaction: any = await TransactionModel.findByPk(req.params.transactionId);

		if(!transaction) {
			return res.status(404).json({
				status: 'failed',
				message: 'Transaction not found',
			});
		}

   await TransactionModel.destroy({
      where: { id: req.params.transactionId },
      force: true,
    });

		const product: any= await ProductModel.findByPk(transaction.productId);

		const updateStock = product.stock + transaction.amountSold;

		await ProductModel.update(
			{ stock: updateStock },
			{
				where: {
					id: transaction.productId,
				},
			},
		);

    res.status(204).json({
      status: 'success',
      message: 'Transaction deleted',
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'failed',
      message: error.message,
    });
  }
};
