import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

export const customerSchema = z.object({
  customerName: z.string().min(2, 'Customer name must be at least 2 characters'),
  mobileNumber: z.string().min(7, 'Mobile number must be at least 7 characters'),
  email: z.string().email('Invalid email address'),
  businessName: z.string().min(2, 'Business name is required'),
  gstNumber: z.string().optional().nullable(),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']),
  address: z.string().min(3, 'Address is required'),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']),
  followUpDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const followUpSchema = z.object({
  note: z.string().min(1, 'Follow-up note cannot be empty'),
});

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || '';
    const customerType = (req.query.customerType as string) || '';

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { customerName: { contains: search } },
        { businessName: { contains: search } },
        { email: { contains: search } },
        { mobileNumber: { contains: search } },
        { gstNumber: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (customerType) {
      where.customerType = customerType;
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: { followUps: true, challans: true },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: customers,
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

export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        followUps: {
          orderBy: { createdAt: 'desc' },
        },
        challans: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    return res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const createdById = req.user?.id;

    const newCustomer = await prisma.customer.create({
      data: {
        customerName: data.customerName,
        mobileNumber: data.mobileNumber,
        email: data.email,
        businessName: data.businessName,
        gstNumber: data.gstNumber || null,
        customerType: data.customerType,
        address: data.address,
        status: data.status,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
        notes: data.notes || null,
        createdById,
        ...(data.notes && {
          followUps: {
            create: {
              note: `Initial Note: ${data.notes}`,
              createdById: req.user?.id || 'system',
              createdByName: req.user?.name || 'System',
            },
          },
        }),
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: newCustomer,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        customerName: data.customerName,
        mobileNumber: data.mobileNumber,
        email: data.email,
        businessName: data.businessName,
        gstNumber: data.gstNumber || null,
        customerType: data.customerType,
        address: data.address,
        status: data.status,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
        notes: data.notes || null,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: updatedCustomer,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addFollowUpNote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const followUp = await prisma.followUpNote.create({
      data: {
        customerId: id,
        note,
        createdById: req.user?.id || 'unknown',
        createdByName: req.user?.name || 'Unknown',
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Follow-up note added',
      data: followUp,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
