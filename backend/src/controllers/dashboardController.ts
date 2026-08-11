import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [
      totalCustomers,
      activeCustomers,
      leadsCount,
      totalProducts,
      allProducts,
      totalChallans,
      confirmedChallans,
      draftChallans,
      stockMovementsCount,
      recentChallans,
      recentMovements,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { status: 'ACTIVE' } }),
      prisma.customer.count({ where: { status: 'LEAD' } }),
      prisma.product.count(),
      prisma.product.findMany({
        select: { id: true, name: true, sku: true, currentStock: true, minStockAlertInt: true, unitPrice: true, category: true },
      }),
      prisma.salesChallan.count(),
      prisma.salesChallan.count({ where: { status: 'CONFIRMED' } }),
      prisma.salesChallan.count({ where: { status: 'DRAFT' } }),
      prisma.stockMovement.count(),
      prisma.salesChallan.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.stockMovement.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { product: { select: { name: true, sku: true } } },
      }),
    ]);

    // Calculate Low Stock Products
    const lowStockProducts = allProducts.filter((p) => p.currentStock <= p.minStockAlertInt);

    // Calculate Inventory Valuation
    const totalInventoryValuation = allProducts.reduce(
      (sum, p) => sum + p.currentStock * p.unitPrice,
      0
    );

    // Calculate Confirmed Sales Revenue
    const confirmedSalesSummary = await prisma.salesChallan.aggregate({
      where: { status: 'CONFIRMED' },
      _sum: { totalAmount: true },
    });

    const totalConfirmedRevenue = confirmedSalesSummary._sum.totalAmount || 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalCustomers,
        activeCustomers,
        leadsCount,
        totalProducts,
        lowStockCount: lowStockProducts.length,
        totalChallans,
        confirmedChallans,
        draftChallans,
        stockMovementsCount,
        totalInventoryValuation,
        totalConfirmedRevenue,
      },
      lowStockAlerts: lowStockProducts,
      recentChallans,
      recentMovements,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
