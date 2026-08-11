export type UserRole = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';

export interface FollowUpNote {
  id: string;
  customerId: string;
  note: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  customerName: string;
  mobileNumber: string;
  email: string;
  businessName: string;
  gstNumber?: string | null;
  customerType: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate?: string | null;
  notes?: string | null;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
  followUps?: FollowUpNote[];
  _count?: {
    followUps: number;
    challans: number;
  };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minStockAlertInt: number;
  locationWarehouse: string;
  createdAt: string;
  updatedAt: string;
  stockMovements?: StockMovement[];
}

export type MovementType = 'IN' | 'OUT';

export interface StockMovement {
  id: string;
  productId: string;
  quantityChanged: number;
  movementType: MovementType;
  reason: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  product?: {
    name: string;
    sku: string;
    category: string;
  };
}

export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface ChallanItem {
  id?: string;
  productId: string;
  productNameSnapshot: string;
  productSkuSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
  subtotal: number;
}

export interface SalesChallan {
  id: string;
  challanNumber: string;
  customerId: string;
  customerName: string;
  customerBusinessName?: string | null;
  totalQuantity: number;
  totalAmount: number;
  status: ChallanStatus;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  items: ChallanItem[];
  customer?: Customer;
}

export interface DashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  leadsCount: number;
  totalProducts: number;
  lowStockCount: number;
  totalChallans: number;
  confirmedChallans: number;
  draftChallans: number;
  stockMovementsCount: number;
  totalInventoryValuation: number;
  totalConfirmedRevenue: number;
}
