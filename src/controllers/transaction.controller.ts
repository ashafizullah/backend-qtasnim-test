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
import { sequelize } from '../config/db';

export const createTransaction = async (req: Request<object, object, CreateTransactionInput>, res: Response) => {
  const transaction = await sequelize.transaction();

  try {
    const { buyerName, productId, amountSold, transactionDate } = req.body;

    const product: any = await ProductModel.findByPk(productId, { transaction });

    if (!product) {
      await transaction.rollback();
      return res.status(404).json({
        status: 'failed',
        message: 'Product not found',
      });
    }

    if (product.stock < amountSold) {
      await transaction.rollback();
      return res.status(400).json({
        status: 'failed',
        message: 'Stock is not enough',
      });
    }

    const totalPrice = product.price * amountSold;
    const updateStock = product.stock - amountSold;

    await Promise.all([
      ProductModel.update(
        { stock: updateStock },
        {
          where: {
            id: productId,
          },
          transaction,
        },
      ),
      TransactionModel.create(
        {
          buyerName,
          productId,
          amountSold,
          totalPrice,
          transactionDate,
        },
        { transaction },
      ),
    ]);

    await transaction.commit();

    res.status(201).json({
      status: 'success',
    });
  } catch (error: any) {
    await transaction.rollback();
    res.status(500).json({
      status: 'failed',
      message: error.message,
    });
  }
};

export const updateTransaction = async ( req: Request<UpdateTransactionInput['params'], object, UpdateTransactionInput['body']>, res: Response) => {
  const t = await sequelize.transaction();

  try {
    const payload: any = {
      ...req.body,
    };

    const oldTransaction: any = await TransactionModel.findByPk(req.params.transactionId, {
      transaction: t,
    });
    const product: any = await ProductModel.findByPk(payload.productId, {
      transaction: t,
    });

    if (!product) {
      await t.rollback();

      return res.status(404).json({
        status: 'failed',
        message: 'Product not found',
      });
    }

    if (product.stock + oldTransaction.amountSold < payload.amountSold) {
      await t.rollback();

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
        transaction: t,
      },
    );

    if (result[0] === 0) {
      await t.rollback();

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
        transaction: t,
      },
    );

    const transaction = await TransactionModel.findByPk(req.params.transactionId, {
      transaction: t,
    });

    await t.commit();

    res.status(200).json({
      status: 'success',
      data: transaction,
    });
  } catch (error: any) {
    await t.rollback();

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
  const transaction = await sequelize.transaction();

  try {
    const transactionRecord: any = await TransactionModel.findByPk(req.params.transactionId, { transaction });

    if (!transactionRecord) {
      await transaction.rollback();
      return res.status(404).json({
        status: 'failed',
        message: 'Transaction not found',
      });
    }

    const productRecord: any = await ProductModel.findByPk(transactionRecord.productId, { transaction });

    if (!productRecord) {
      await transaction.rollback();
      return res.status(404).json({
        status: 'failed',
        message: 'Product not found',
      });
    }

    const updateStock = productRecord.stock + transactionRecord.amountSold;

    await Promise.all([
      TransactionModel.destroy({
        where: { id: req.params.transactionId },
        force: true,
        transaction,
      }),
      ProductModel.update(
        { stock: updateStock },
        {
          where: {
            id: transactionRecord.productId,
          },
          transaction,
        },
      ),
    ]);

    await transaction.commit();

    res.status(204).json({
      status: 'success',
      message: 'Transaction deleted',
    });
  } catch (error: any) {
    await transaction.rollback();
    res.status(500).json({
      status: 'failed',
      message: error.message,
    });
  }
};

export const getMostSoldProductByProductTypeId = async (req: Request<ParamsInput>, res: Response) => {
  try {
    const transactions = await TransactionModel.findAll({
      include: [
        {
          model: ProductModel,
          as: 'product',
          where: { productTypeId: req.params.productTypeId },
        },
      ],
    });

		const mostSoldProduct = transactions.reduce((acc: any, curr: any) => {
			const found = acc.find((item: any) => item.productId == curr.productId);
			if (found) {
				found.amountSold += curr.amountSold;
			} else {
				acc.push(curr);
			}
			return acc;
		}
		, []);

		const sortedMostSoldProduct = mostSoldProduct.sort((a: any, b: any) => b.amountSold - a.amountSold);

		res.status(200).json({
			status: 'success',
			data: sortedMostSoldProduct,
		});
  } catch (error: any) {
    res.status(500).json({
      status: 'failed',
      message: error.message,
    });
  }
};