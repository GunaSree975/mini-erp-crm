"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seeding...');
    // Clean existing data
    await prisma.challanItem.deleteMany();
    await prisma.salesChallan.deleteMany();
    await prisma.stockMovement.deleteMany();
    await prisma.followUpNote.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
    const passwordHash = await bcryptjs_1.default.hash('Admin123!', 10);
    const salesHash = await bcryptjs_1.default.hash('Sales123!', 10);
    const warehouseHash = await bcryptjs_1.default.hash('Warehouse123!', 10);
    const accountsHash = await bcryptjs_1.default.hash('Accounts123!', 10);
    // 1. Create Users for each Role
    const admin = await prisma.user.create({
        data: {
            name: 'System Administrator',
            email: 'admin@company.com',
            password: passwordHash,
            role: 'ADMIN',
        },
    });
    const salesUser = await prisma.user.create({
        data: {
            name: 'Rajesh Kumar (Sales Exec)',
            email: 'sales@company.com',
            password: salesHash,
            role: 'SALES',
        },
    });
    const warehouseUser = await prisma.user.create({
        data: {
            name: 'Vikram Singh (Warehouse Manager)',
            email: 'warehouse@company.com',
            password: warehouseHash,
            role: 'WAREHOUSE',
        },
    });
    const accountsUser = await prisma.user.create({
        data: {
            name: 'Priya Sharma (Accounts Lead)',
            email: 'accounts@company.com',
            password: accountsHash,
            role: 'ACCOUNTS',
        },
    });
    console.log('✅ Created Users for all 4 roles');
    // 2. Create Customers
    const customer1 = await prisma.customer.create({
        data: {
            customerName: 'Aarav Patel',
            mobileNumber: '+919876543210',
            email: 'aarav@apexdistributors.com',
            businessName: 'Apex Industrial Distributors',
            gstNumber: '27AAAAA0000A1Z5',
            customerType: 'DISTRIBUTOR',
            address: 'Plot 42, MIDC Industrial Area, Andheri East, Mumbai, MH 400093',
            status: 'ACTIVE',
            followUpDate: new Date(Date.now() + 86400000 * 3), // 3 days later
            notes: 'Key distributor for Western region. High order volume.',
            createdById: salesUser.id,
            followUps: {
                create: [
                    {
                        note: 'Initial inquiry regarding bulk fasteners order.',
                        createdById: salesUser.id,
                        createdByName: salesUser.name,
                    },
                    {
                        note: 'Quotation sent. Agreed on 15-day credit terms.',
                        createdById: salesUser.id,
                        createdByName: salesUser.name,
                    },
                ],
            },
        },
    });
    const customer2 = await prisma.customer.create({
        data: {
            customerName: 'Sanjay Mehta',
            mobileNumber: '+919812345678',
            email: 'mehta@shreetraders.in',
            businessName: 'Shree Hardware Traders',
            gstNumber: '07BBBBA1111B2Z3',
            customerType: 'WHOLESALE',
            address: '104 Chandni Chowk Market, New Delhi, DL 110006',
            status: 'LEAD',
            followUpDate: new Date(Date.now() + 86400000), // tomorrow
            notes: 'Potential wholesale buyer. Interested in power tools range.',
            createdById: salesUser.id,
            followUps: {
                create: [
                    {
                        note: 'Met at Hardware Expo 2026. Requested sample catalog.',
                        createdById: salesUser.id,
                        createdByName: salesUser.name,
                    },
                ],
            },
        },
    });
    const customer3 = await prisma.customer.create({
        data: {
            customerName: 'Deepak Varma',
            mobileNumber: '+919988776655',
            email: 'deepak@varmaenterprises.com',
            businessName: 'Varma Engineering Solutions',
            gstNumber: '33CCCCA2222C3Z1',
            customerType: 'RETAIL',
            address: '78 Industrial Estate, Guindy, Chennai, TN 600032',
            status: 'INACTIVE',
            followUpDate: null,
            notes: 'Account suspended due to overdue invoice resolution pending.',
            createdById: admin.id,
        },
    });
    console.log('✅ Created Sample Customers & Follow-up Notes');
    // 3. Create Products
    const p1 = await prisma.product.create({
        data: {
            name: 'Heavy Duty M12 Stainless Steel Bolts (Pack of 100)',
            sku: 'SKU-BOLT-M12-100',
            category: 'Fasteners',
            unitPrice: 1250.0,
            currentStock: 150,
            minStockAlertInt: 25,
            locationWarehouse: 'Warehouse A - Rack 04',
        },
    });
    const p2 = await prisma.product.create({
        data: {
            name: 'Industrial Cordless Drill Machine 20V',
            sku: 'SKU-TOOL-DRILL-20V',
            category: 'Power Tools',
            unitPrice: 4850.0,
            currentStock: 18,
            minStockAlertInt: 10,
            locationWarehouse: 'Warehouse B - Shelf 12',
        },
    });
    const p3 = await prisma.product.create({
        data: {
            name: 'Safety Helmet - High Impact Yellow',
            sku: 'SKU-PPE-HELMET-YEL',
            category: 'Safety Equipment',
            unitPrice: 350.0,
            currentStock: 4, // Below min threshold (5) -> triggers low stock alert!
            minStockAlertInt: 10,
            locationWarehouse: 'Warehouse A - Rack 01',
        },
    });
    const p4 = await prisma.product.create({
        data: {
            name: 'Pneumatic Impact Wrench 1/2 Inch',
            sku: 'SKU-TOOL-WRENCH-PNEU',
            category: 'Power Tools',
            unitPrice: 6200.0,
            currentStock: 35,
            minStockAlertInt: 5,
            locationWarehouse: 'Warehouse B - Shelf 08',
        },
    });
    console.log('✅ Created Sample Products');
    // 4. Create Initial Stock Movement Logs
    await prisma.stockMovement.createMany({
        data: [
            {
                productId: p1.id,
                quantityChanged: 150,
                movementType: 'IN',
                reason: 'Initial Inward Shipment (PO #9001)',
                createdById: warehouseUser.id,
                createdByName: warehouseUser.name,
            },
            {
                productId: p2.id,
                quantityChanged: 20,
                movementType: 'IN',
                reason: 'Vendor Delivery Received',
                createdById: warehouseUser.id,
                createdByName: warehouseUser.name,
            },
            {
                productId: p3.id,
                quantityChanged: 50,
                movementType: 'IN',
                reason: 'Safety Inventory Arrival',
                createdById: warehouseUser.id,
                createdByName: warehouseUser.name,
            },
        ],
    });
    // 5. Create Initial Sales Challans
    const challan1 = await prisma.salesChallan.create({
        data: {
            challanNumber: 'CH-2026-0001',
            customerId: customer1.id,
            customerName: customer1.customerName,
            customerBusinessName: customer1.businessName,
            totalQuantity: 5,
            totalAmount: 1250 * 5,
            status: 'CONFIRMED',
            createdById: salesUser.id,
            createdByName: salesUser.name,
            items: {
                create: [
                    {
                        productId: p1.id,
                        productNameSnapshot: p1.name,
                        productSkuSnapshot: p1.sku,
                        unitPriceSnapshot: p1.unitPrice,
                        quantity: 5,
                        subtotal: 1250 * 5,
                    },
                ],
            },
        },
    });
    const challan2 = await prisma.salesChallan.create({
        data: {
            challanNumber: 'CH-2026-0002',
            customerId: customer2.id,
            customerName: customer2.customerName,
            customerBusinessName: customer2.businessName,
            totalQuantity: 2,
            totalAmount: 4850 * 2,
            status: 'DRAFT',
            createdById: salesUser.id,
            createdByName: salesUser.name,
            items: {
                create: [
                    {
                        productId: p2.id,
                        productNameSnapshot: p2.name,
                        productSkuSnapshot: p2.sku,
                        unitPriceSnapshot: p2.unitPrice,
                        quantity: 2,
                        subtotal: 4850 * 2,
                    },
                ],
            },
        },
    });
    console.log('✅ Created Initial Sales Challans');
    console.log('🎉 Database seeding completed successfully!');
}
main()
    .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
