# Full-Stack Case Study Submission: Mini ERP + CRM Operations Portal

**Candidate Submission Document**  
**Project**: Mini ERP + CRM Operations Portal for Wholesale & Distribution  
**Technology Stack**: Node.js, TypeScript, Express.js, Prisma ORM, React 18, Vite, Tailwind CSS, Docker  

---

## 📄 Executive Summary

The **Nexus Mini ERP + CRM Operations Portal** is an enterprise-grade, responsive full-stack web application designed for wholesale and distribution companies. It unifies business workflows across **Sales**, **Warehouse**, **Accounts**, and **Executive Management (Admin)** teams into a single operations dashboard.

### Key Highlights
- **Role-Based Access Control (RBAC)**: Fine-grained permissions for 4 pre-configured roles with a 1-click evaluation role-switcher toolbar.
- **Customer CRM**: Management of Leads, Active accounts, and Inactive clients, complete with an interactive follow-up timeline and note logger.
- **Inventory Control**: Real-time stock movement audit logs (`IN` / `OUT`) and automatic low-stock alert thresholds.
- **Sales Challans & Invoices**: Multi-product challan generation with **atomic stock reduction**, non-negative stock enforcement, historical product price snapshots, and print/PDF invoice generation.
- **Developer Experience**: Production builds with TypeScript compilation, containerized Docker setup, and complete Postman API collection.

---

## 🏛️ System Architecture & Technology Stack

### System Topology
```
                  ┌─────────────────────────────────────────┐
                  │          React 18 Frontend UI           │
                  │   Vite + TypeScript + Tailwind CSS      │
                  └────────────────────┬────────────────────┘
                                       │ REST API (JSON)
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │          Node.js Express Backend        │
                  │  JWT Auth + Zod + RBAC + Controller API  │
                  └────────────────────┬────────────────────┘
                                       │ Prisma ORM
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │         Database Storage Layer          │
                  │   SQLite (Dev) / PostgreSQL (Prod)     │
                  └─────────────────────────────────────────┘
```

### Stack Breakdown

| Component | Framework / Library | Purpose & Rationale |
| :--- | :--- | :--- |
| **Backend API** | Node.js, Express, TypeScript | Scalable, strictly-typed RESTful service layer |
| **ORM & Database** | Prisma ORM, SQLite / PostgreSQL | Fully typed database schema, migrations, and atomic transaction support |
| **Validation** | Zod | Runtime schema validation for all API request bodies |
| **Auth & Security** | JWT, Bcrypt.js | Stateless JSON Web Tokens & salted password hashing |
| **Frontend UI** | React 18, Vite, TypeScript | Fast SPA rendering, component modularity |
| **Styling & Icons** | Tailwind CSS, Lucide React | Modern dark-mode aesthetic with responsive layouts |
| **DevOps & Containers**| Docker, Docker Compose | Containerized local execution for frontend & backend |

---

## 🔑 Test Credentials (All Roles Pre-seeded)

For immediate evaluation, all 4 user roles are pre-seeded in the database:

| Role | Email | Password | Scope & Operational Capabilities |
| :--- | :--- | :--- | :--- |
| 🛡️ **Admin** | `admin@company.com` | `Admin123!` | Unrestricted full system access (Users, Customers, Inventory, Challans, Analytics) |
| 💼 **Sales** | `sales@company.com` | `Sales123!` | Customer CRM, Follow-up notes, Create/View Sales Challans |
| 📦 **Warehouse**| `warehouse@company.com` | `Warehouse123!` | Product inventory management, Stock Movements (`IN`/`OUT`), Order fulfillment checks |
| 📊 **Accounts** | `accounts@company.com` | `Accounts123!` | Financial dashboards, View/Confirm Challans, Billing & Invoice issuance |

> **Evaluator Tip**: The frontend includes a **"Switch Role Demo"** toolbar at the top navbar allowing 1-click role switching without manually logging out.

---

## 📦 Core Modules & Business Logic

### 1. Customer CRM Module
- **Attributes**: Customer Name, Mobile Number, Email, Business Name, GST Number (Optional), Customer Type (`RETAIL`, `WHOLESALE`, `DISTRIBUTOR`), Address, Status (`LEAD`, `ACTIVE`, `INACTIVE`), Follow-up Date, Notes.
- **Key Features**:
  - Search by customer name, business, email, or GST number.
  - Status filters (`Leads`, `Active`, `Inactive`).
  - **Follow-up Timeline**: Modal drawer displaying timestamped follow-up notes with user attribution.

### 2. Product & Inventory Module
- **Attributes**: Product Name, SKU Code, Category, Unit Price (₹), Current Stock Qty, Minimum Stock Alert Qty, Location/Warehouse Bin.
- **Key Features**:
  - **Low Stock Warning Alert**: Visual alert banners for items at or below minimum threshold.
  - **Stock Movement Log**: Audit log tracking quantity changes, type (`IN` / `OUT`), reason, created by user, and timestamp.
  - Stock adjustment modal for recording inward deliveries or outward manual write-offs.

### 3. Sales Challan Module
- **Attributes**: Challan Number (Auto-generated `CH-YYYY-XXXX`), Customer ID, Customer Snapshot, Line Items, Total Qty, Total Amount, Status (`DRAFT`, `CONFIRMED`, `CANCELLED`), Created By, Created Date.
- **Critical Business Rules**:
  - **Atomic Stock Reduction**: Confirming a draft or new challan atomically decrements inventory via `prisma.$transaction`.
  - **Non-Negative Stock Enforcement**: If requested quantity exceeds current stock, the API rejects the request with HTTP 400 detailing out-of-stock items.
  - **Snapshot Pattern**: Challan line items store frozen snapshots of Product Name, SKU, and Unit Price at generation time to preserve historical financial accuracy.
  - **Printable/Downloadable PDF Invoice**: Browser-optimized invoice template with print & PDF export capabilities.

---

## 🗄️ Database ER Schema Summary

```prisma
model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  password  String
  role      String   // ADMIN, SALES, WAREHOUSE, ACCOUNTS
  createdAt DateTime @default(now())
}

model Customer {
  id           String         @id @default(uuid())
  customerName String
  mobileNumber String
  email        String
  businessName String
  gstNumber    String?
  customerType String         // RETAIL, WHOLESALE, DISTRIBUTOR
  address      String
  status       String         // LEAD, ACTIVE, INACTIVE
  followUpDate DateTime?
  notes        String?
  followUps    FollowUpNote[]
  challans     SalesChallan[]
}

model Product {
  id                 String          @id @default(uuid())
  name               String
  sku                String          @unique
  category           String
  unitPrice          Float
  currentStock       Int
  minStockAlertInt   Int             @default(5)
  locationWarehouse  String
  stockMovements     StockMovement[]
}

model SalesChallan {
  id            String        @id @default(uuid())
  challanNumber String        @unique
  customerId    String
  customer      Customer      @relation(fields: [customerId], references: [id])
  totalQuantity Int
  totalAmount   Float
  status        String        // DRAFT, CONFIRMED, CANCELLED
  items         ChallanItem[]
}

model ChallanItem {
  id                  String       @id @default(uuid())
  challanId           String
  productId           String
  productNameSnapshot String
  productSkuSnapshot  String
  unitPriceSnapshot   Float
  quantity            Int
  subtotal            Float
}
```

---

## 📡 REST API Reference

| Endpoint | Method | Role Permission | Description |
| :--- | :---: | :--- | :--- |
| `/api/auth/login` | `POST` | Public | Authenticate user & return JWT token |
| `/api/auth/me` | `GET` | Authenticated | Fetch active user profile |
| `/api/customers` | `GET` | All Roles | List customers with search, status filter, & pagination |
| `/api/customers` | `POST` | Admin, Sales | Create a new customer account |
| `/api/customers/:id` | `GET` | All Roles | Fetch customer details & follow-up notes |
| `/api/customers/:id/follow-ups` | `POST` | Admin, Sales | Append a new follow-up note |
| `/api/products` | `GET` | All Roles | List products (Supports `?lowStock=true` filter) |
| `/api/products` | `POST` | Admin, Warehouse | Create a new product SKU |
| `/api/products/:id/stock-movement` | `POST` | Admin, Warehouse | Record stock movement (`IN` / `OUT`) |
| `/api/products/movements/log` | `GET` | All Roles | Fetch comprehensive stock movement audit log |
| `/api/challans` | `GET` | All Roles | List Sales Challans with status filter & search |
| `/api/challans` | `POST` | Admin, Sales | Create Sales Challan (Draft or Confirmed) |
| `/api/challans/:id/status` | `PATCH` | All Roles | Update status (Confirm Draft / Cancel) |
| `/api/dashboard/stats` | `GET` | Authenticated | Fetch executive dashboard statistics & low stock alerts |

---

## 💻 Local Setup Instructions

### 1. Prerequisites
- Node.js (v18+ or v20+)
- npm or yarn

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Apply database schema & seed initial test data
npx prisma db push
npm run db:seed

# Start dev server (Runs on http://localhost:5000)
npm run dev
```

### 3. Frontend Setup
In a new terminal:
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite dev server (Runs on http://localhost:3000)
npm run dev
```
Open your browser at `http://localhost:3000`.

---

## 🐳 Docker Deployment Setup (Bonus)

To run the application using Docker Compose:

```bash
docker-compose up --build
```
- **Frontend App**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`

---

## 🚀 Free Tier Live Deployment Guide

### Option 1: Frontend on Vercel / Netlify
1. Connect your GitHub repository to Vercel/Netlify.
2. Set Root Directory to `frontend`.
3. Set Build Command to `npm run build` and Output Directory to `dist`.
4. Add Environment Variable:
   - `VITE_API_URL` = `https://your-backend-service.onrender.com/api`

### Option 2: Backend on Render / Railway
1. Create a new Web Service on Render/Railway pointing to the `backend` folder.
2. Set Build Command to `npm run build && npx prisma db push && npm run db:seed`.
3. Set Start Command to `npm start`.
4. Environment Variables:
   - `PORT` = `5000`
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = `file:./dev.db` (or Neon PostgreSQL connection string)
   - `JWT_SECRET` = `your-secret-key`

---

## 📮 Postman Collection Instructions

A complete Postman API collection is included in the project root:
`postman_collection.json`

1. Open Postman -> Click **Import** -> Upload `postman_collection.json`.
2. Run the `Login - Admin Role` request to automatically set the JWT environment variable.
3. Test all pre-configured endpoints for Auth, CRM, Inventory, Challans, and Dashboard metrics.

---

## ⚠️ Known Limitations & Future Roadmap

1. **S3 File Uploads**: Product images currently utilize categorized iconography; direct AWS S3 presigned URL integration hooks are prepared in the code structure.
2. **Multi-State Tax Calculations**: Current Challan handles direct subtotals & grand totals; detailed IGST vs CGST/SGST breakdowns can be expanded for complex multi-state GST filing.
