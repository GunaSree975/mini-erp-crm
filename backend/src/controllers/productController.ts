import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

export const productSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  sku: z.string().min(2, 'SKU / Code is required'),
  category: z.string().min(2, 'Category is required'),
  unitPrice: z.number().positive('Unit price must be greater than 0'),
  currentStock: z.number().int().min(0, 'Stock cannot be negative'),
  minStockAlertInt: z.number().int().min(0, 'Minimum stock alert must be 0 or higher'),
  locationWarehouse: z.string().min(2, 'Warehouse location is required'),
});

export const stockMovementSchema = z.object({
  quantityChanged: z.number().int().positive('Quantity changed must be greater than 0'),
  movementType: z.enum(['IN', 'OUT']),
  reason: z.string().min(2, 'Reason for stock movement is required'),
});

export const getProducts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const category = (req.query.category as string) || '';
    const lowStockOnly = req.query.lowStock === 'true';

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { category: { contains: search } },
        { locationWarehouse: { contains: search } },
      ];
    }

    if (category) {
      where.category = category;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    // Filter low stock if requested in application layer or raw query
    let filteredProducts = products;
    if (lowStockOnly) {
      filteredProducts = products.filter((p) => p.currentStock <= p.minStockAlertInt);
    }

    return res.status(200).json({
      success: true,
      data: filteredProducts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const data = req.body;

    const existingSku = await prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (existingSku) {
      return res.status(400).json({
        success: false,
        message: `Product with SKU '${data.sku}' already exists`,
      });
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        category: data.category,
        unitPrice: data.unitPrice,
        currentStock: data.currentStock,
        minStockAlertInt: data.minStockAlertInt,
        locationWarehouse: data.locationWarehouse,
        ...(data.currentStock > 0 && {
          stockMovements: {
            create: {
              quantityChanged: data.currentStock,
              movementType: 'IN',
              reason: 'Initial Opening Stock Entry',
              createdById: req.user?.id || 'system',
              createdByName: req.user?.name || 'System',
            },
          },
        }),
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (data.sku && data.sku !== existing.sku) {
      const duplicateSku = await prisma.product.findUnique({ where: { sku: data.sku } });
      if (duplicateSku) {
        return res.status(400).json({
          success: false,
          message: `Product with SKU '${data.sku}' already exists`,
        });
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        sku: data.sku,
        category: data.category,
        unitPrice: data.unitPrice,
        minStockAlertInt: data.minStockAlertInt,
        locationWarehouse: data.locationWarehouse,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addStockMovement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantityChanged, movementType, reason } = req.body;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (movementType === 'OUT' && product.currentStock < quantityChanged) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for product '${product.name}'. Current stock: ${product.currentStock}, Requested reduction: ${quantityChanged}`,
      });
    }

    const newStock =
      movementType === 'IN'
        ? product.currentStock + quantityChanged
        : product.currentStock - quantityChanged;

    const result = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id },
        data: { currentStock: newStock },
      });

      const movement = await tx.stockMovement.create({
        data: {
          productId: id,
          quantityChanged,
          movementType,
          reason,
          createdById: req.user?.id || 'unknown',
          createdByName: req.user?.name || 'Unknown',
        },
      });

      return { product: updatedProduct, movement };
    });

    return res.status(200).json({
      success: true,
      message: `Stock updated successfully (${movementType} ${quantityChanged})`,
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getStockMovements = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const skip = (page - 1) * limit;

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { name: true, sku: true, category: true },
          },
        },
      }),
      prisma.stockMovement.count(),
    ]);

    return res.status(200).json({
      success: true,
      data: movements,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
