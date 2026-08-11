import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

export const challanItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
});

export const createChallanSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  status: z.enum(['DRAFT', 'CONFIRMED']).default('DRAFT'),
  items: z.array(challanItemSchema).min(1, 'At least one product item is required'),
});

// Helper function to auto-generate Next Challan Number
const generateChallanNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `CH-${year}-`;

  const lastChallan = await prisma.salesChallan.findFirst({
    where: {
      challanNumber: { startsWith: prefix },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!lastChallan) {
    return `${prefix}0001`;
  }

  const lastNumStr = lastChallan.challanNumber.replace(prefix, '');
  const lastNum = parseInt(lastNumStr, 10) || 0;
  const nextNum = lastNum + 1;
  return `${prefix}${nextNum.toString().padStart(4, '0')}`;
};

export const getChallans = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || '';

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { challanNumber: { contains: search } },
        { customerName: { contains: search } },
        { customerBusinessName: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [challans, total] = await Promise.all([
      prisma.salesChallan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          customer: {
            select: { email: true, mobileNumber: true, gstNumber: true, address: true },
          },
        },
      }),
      prisma.salesChallan.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: challans,
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

export const getChallanById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: {
        items: true,
        customer: true,
      },
    });

    if (!challan) {
      return res.status(404).json({ success: false, message: 'Challan not found' });
    }

    return res.status(200).json({
      success: true,
      data: challan,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createChallan = async (req: Request, res: Response) => {
  try {
    const { customerId, status, items } = req.body;
    const userId = req.user?.id || 'unknown';
    const userName = req.user?.name || 'Unknown';

    // 1. Fetch Customer
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // 2. Fetch Products & Create Snapshots
    const productIds = items.map((i: any) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more selected products do not exist.',
      });
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate Stock if confirming immediately
    const stockErrors: string[] = [];
    let totalQuantity = 0;
    let totalAmount = 0;

    const lineItemsData: any[] = [];

    for (const item of items) {
      const p = productMap.get(item.productId)!;
      if (status === 'CONFIRMED' && p.currentStock < item.quantity) {
        stockErrors.push(
          `Insufficient stock for '${p.name}' (SKU: ${p.sku}). Requested: ${item.quantity}, Available: ${p.currentStock}`
        );
      }

      const subtotal = p.unitPrice * item.quantity;
      totalQuantity += item.quantity;
      totalAmount += subtotal;

      lineItemsData.push({
        productId: p.id,
        productNameSnapshot: p.name,
        productSkuSnapshot: p.sku,
        unitPriceSnapshot: p.unitPrice,
        quantity: item.quantity,
        subtotal,
      });
    }

    if (stockErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock validation failed for Challan confirmation.',
        errors: stockErrors,
      });
    }

    const challanNumber = await generateChallanNumber();

    // Execute atomic transaction for Challan + Stock updates + Stock movements if CONFIRMED
    const result = await prisma.$transaction(async (tx) => {
      const challan = await tx.salesChallan.create({
        data: {
          challanNumber,
          customerId: customer.id,
          customerName: customer.customerName,
          customerBusinessName: customer.businessName,
          totalQuantity,
          totalAmount,
          status,
          createdById: userId,
          createdByName: userName,
          items: {
            create: lineItemsData,
          },
        },
        include: {
          items: true,
        },
      });

      if (status === 'CONFIRMED') {
        for (const item of items) {
          const p = productMap.get(item.productId)!;
          await tx.product.update({
            where: { id: p.id },
            data: {
              currentStock: {
                decrement: item.quantity,
              },
            },
          });

          await tx.stockMovement.create({
            data: {
              productId: p.id,
              quantityChanged: item.quantity,
              movementType: 'OUT',
              reason: `Sales Challan Confirmation (${challanNumber})`,
              createdById: userId,
              createdByName: userName,
            },
          });
        }
      }

      return challan;
    });

    return res.status(201).json({
      success: true,
      message: `Sales Challan ${challanNumber} created as ${status}`,
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateChallanStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // CONFIRMED or CANCELLED

    if (!['CONFIRMED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Status can only be changed to CONFIRMED or CANCELLED',
      });
    }

    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!challan) {
      return res.status(404).json({ success: false, message: 'Challan not found' });
    }

    if (challan.status === 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        message: 'Challan is already confirmed and cannot be altered.',
      });
    }

    if (challan.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Challan is already cancelled.',
      });
    }

    const userId = req.user?.id || 'unknown';
    const userName = req.user?.name || 'Unknown';

    if (status === 'CONFIRMED') {
      // Validate current stock levels for each item
      const productIds = challan.items.map((i) => i.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));
      const stockErrors: string[] = [];

      for (const item of challan.items) {
        const p = productMap.get(item.productId);
        if (!p) {
          stockErrors.push(`Product '${item.productNameSnapshot}' no longer exists in system.`);
        } else if (p.currentStock < item.quantity) {
          stockErrors.push(
            `Insufficient stock for '${p.name}'. Current stock: ${p.currentStock}, Required: ${item.quantity}`
          );
        }
      }

      if (stockErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot confirm challan due to stock insufficiency.',
          errors: stockErrors,
        });
      }

      // Execute confirmation transaction
      const updatedChallan = await prisma.$transaction(async (tx) => {
        const updated = await tx.salesChallan.update({
          where: { id },
          data: { status: 'CONFIRMED' },
          include: { items: true },
        });

        for (const item of challan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              currentStock: { decrement: item.quantity },
            },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantityChanged: item.quantity,
              movementType: 'OUT',
              reason: `Confirmed Draft Sales Challan (${challan.challanNumber})`,
              createdById: userId,
              createdByName: userName,
            },
          });
        }

        return updated;
      });

      return res.status(200).json({
        success: true,
        message: `Challan ${challan.challanNumber} confirmed and stock updated`,
        data: updatedChallan,
      });
    } else {
      // CANCELLED status update
      const updatedChallan = await prisma.salesChallan.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: { items: true },
      });

      return res.status(200).json({
        success: true,
        message: `Challan ${challan.challanNumber} has been cancelled`,
        data: updatedChallan,
      });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
