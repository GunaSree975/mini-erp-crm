"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFollowUpNote = exports.updateCustomer = exports.createCustomer = exports.getCustomerById = exports.getCustomers = exports.followUpSchema = exports.customerSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
exports.customerSchema = zod_1.z.object({
    customerName: zod_1.z.string().min(2, 'Customer name must be at least 2 characters'),
    mobileNumber: zod_1.z.string().min(7, 'Mobile number must be at least 7 characters'),
    email: zod_1.z.string().email('Invalid email address'),
    businessName: zod_1.z.string().min(2, 'Business name is required'),
    gstNumber: zod_1.z.string().optional().nullable(),
    customerType: zod_1.z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']),
    address: zod_1.z.string().min(3, 'Address is required'),
    status: zod_1.z.enum(['LEAD', 'ACTIVE', 'INACTIVE']),
    followUpDate: zod_1.z.string().optional().nullable(),
    notes: zod_1.z.string().optional().nullable(),
});
exports.followUpSchema = zod_1.z.object({
    note: zod_1.z.string().min(1, 'Follow-up note cannot be empty'),
});
const getCustomers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const status = req.query.status || '';
        const customerType = req.query.customerType || '';
        const skip = (page - 1) * limit;
        const where = {};
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
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getCustomers = getCustomers;
const getCustomerById = async (req, res) => {
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
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getCustomerById = getCustomerById;
const createCustomer = async (req, res) => {
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
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.createCustomer = createCustomer;
const updateCustomer = async (req, res) => {
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
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateCustomer = updateCustomer;
const addFollowUpNote = async (req, res) => {
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
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.addFollowUpNote = addFollowUpNote;
