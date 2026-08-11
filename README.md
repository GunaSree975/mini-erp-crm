# Mini ERP + CRM Operations Portal

A full-stack enterprise wholesale distribution **Mini ERP + CRM Operations Portal** built with **Node.js, TypeScript, Express, Prisma ORM, React (Vite), and Tailwind CSS**.

Designed for internal wholesale teams (Sales, Warehouse, Accounts, Admin) to manage customer leads, product stock inventory, low stock alerts, stock movement logs, and transactional Sales Challans with strict non-negative stock enforcement.

---

## 🌟 Key Features

1. **Authentication & Role-Based Access Control (RBAC)**:
   - 4 Pre-configured User Roles: `ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`.
   - Built-in **1-Click Demo Role Switcher Toolbar** on frontend for instant role evaluation.

2. **Customer CRM Module**:
   - Manage Customer accounts & leads (`Lead`, `Active`, `Inactive`).
   - Customer Types: `Retail`, `Wholesale`, `Distributor`.
   - Contact details, Business Name, optional GST number, Address, Follow-up date.
   - Interactive **Follow-up Timeline & Note Logger**.

3. **Product & Inventory Module**:
   - Product SKUs, Category, Unit Price, Current Stock, Warehouse location.
   - **Minimum Stock Threshold Alerts**: Top banner warning & low-stock highlight tags.
   - **Stock Movement Log Audit**: Tracks quantity changes, type (`IN` or `OUT`), reason, created by user, and timestamp.

4. **Sales Challan & Dispatch Module**:
   - Auto-generated Challan Numbers (e.g. `CH-2026-0001`).
   - Customer selection & multi-product line items with subtotal calculations.
   - Save as `DRAFT` or `CONFIRMED`.
   - **Strict Business Logic & Atomic Transactions**:
     - Confirming a challan automatically deducts product inventory atomically.
     - Enforces non-negative stock. Throws HTTP 400 error if stock is insufficient.
     - Stores **Product Snapshot Data** (Name, SKU, Price at creation time) to preserve historical accuracy even if catalog specs change.
   - **Printable / Downloadable Invoice & Challan view**.

5. **Executive Analytics Dashboard**:
   - Total Confirmed Revenue (₹), Inventory Valuation (₹), Active Customers, Pending Drafts.
   - Low Stock Alert Notifications banner.
   - Feeds for recent Challans and recent Stock Movements.

---

## 🔑 Test Login Credentials (Pre-seeded)

All accounts are pre-seeded in the database:

| Role | Email | Password | Allowed Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@company.com` | `Admin123!` | Full unrestricted system access |
| **Sales** | `sales@company.com` | `Sales123!` | Customer CRM, Create & Confirm Sales Challans, View Inventory |
| **Warehouse** | `warehouse@company.com` | `Warehouse123!` | Product Catalog, Adjust Stock (IN/OUT), View Confirmed Challans |
| **Accounts** | `accounts@company.com` | `Accounts123!` | View Financial Summaries, Customers, Confirm Challans & Issue Invoices |

---

## 🛠️ Technology Stack

- **Backend**: Node.js, TypeScript, Express.js, Prisma ORM, SQLite (Default) / PostgreSQL (Optional), Zod Validation, JWT Auth, Bcrypt.js.
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React Icons, Axios.
- **DevOps**: Docker, Docker Compose, Postman Collection.

---

## 🚀 Quick Local Setup Instructions

### Prerequisites
- Node.js (v18+ or v20+)
- npm or yarn

### 1. Clone & Setup Backend
```bash
cd backend

# Install dependencies
npm install

# Push database schema & seed initial data (Admin, Sales, Warehouse, Accounts, Customers, Products, Challans)
npx prisma db push
npm run db:seed

# Start backend server in dev mode (Runs on http://localhost:5000)
npm run dev
```

### 2. Setup Frontend
In a separate terminal:
```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server (Runs on http://localhost:3000)
npm run dev
```

Open your browser at `http://localhost:3000`. You can log in using any of the credentials above, or use the **1-Click Evaluation Quick Login** buttons on the login page!

---

## 🐳 Docker Setup (Bonus)

To run the entire full-stack application using Docker Compose:

```bash
docker-compose up --build
```
- **Frontend**: Available at `http://localhost:3000`
- **Backend API**: Available at `http://localhost:5000`

---

## 📑 Postman Collection

A complete Postman collection is included at the root of this repository:
[`postman_collection.json`](file:///C:/Users/gunas/.gemini/antigravity/scratch/mini-erp-crm/postman_collection.json)

### How to use:
1. Open Postman -> Click **Import** -> Select `postman_collection.json`.
2. Run `Login - Admin Role` to obtain a JWT token.
3. The requests are pre-configured for:
   - `POST /api/auth/login`
   - `GET /api/auth/me`
   - `GET /api/customers`, `POST /api/customers`, `POST /api/customers/:id/follow-ups`
   - `GET /api/products?lowStock=true`, `POST /api/products`, `POST /api/products/:id/stock-movement`, `GET /api/products/movements/log`
   - `GET /api/challans`, `POST /api/challans`, `PATCH /api/challans/:id/status`
   - `GET /api/dashboard/stats`

---

## 🌐 Environment Variables & Deployment

### Environment Variables
- **Backend `.env`**:
  ```env
  PORT=5000
  NODE_ENV=production
  DATABASE_URL="file:./dev.db" # Or postgresql://user:pass@host:5432/dbname
  JWT_SECRET="super-secret-mini-erp-crm-jwt-key-2026"
  JWT_EXPIRES_IN="1d"
  ```
- **Frontend `.env`**:
  ```env
  VITE_API_URL="http://localhost:5000/api" # Or live backend URL
  ```

### Deployment Guide
1. **Frontend (Vercel / Netlify / Render Static)**:
   - Root directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment variable: Set `VITE_API_URL` to your deployed backend URL.

2. **Backend (Render / Railway / Fly.io)**:
   - Root directory: `backend`
   - Build Command: `npm run build && npx prisma db push && npm run db:seed`
   - Start Command: `npm start`

3. **Database (Neon / Supabase / Render Postgres)**:
   - Provision a PostgreSQL database on Neon/Supabase.
   - Update `DATABASE_URL` in backend `.env` and change `provider = "postgresql"` in `backend/prisma/schema.prisma`.

---

## 🏛️ System Architecture & Design Rationale

- **Modular Monolith**: Separated backend REST API and React frontend for clean separation of concerns.
- **Snapshot Pattern for Challans**: Line items store immutable snapshots of product name, SKU, and unit price at transaction time. This ensures that historic sales challans and invoices remain accurate even if catalog prices change later.
- **Atomic Transactions for Inventory**: Stock reductions during sales challan confirmation are executed inside Prisma database transactions (`prisma.$transaction`). If any single item has insufficient stock, the transaction aborts and returns an informative HTTP 400 error.
- **RBAC Middleware**: Fine-grained role checks (`requireRole(['ADMIN', 'SALES'])`) protect write endpoints while allowing read-only access where appropriate.

---

## ⚠️ Known Limitations & Future Enhancements
- **Image Uploads**: Product images currently use default category icons; S3 integration hook prepared.
- **Advanced Tax Rules**: Sales Challan computes direct subtotals & grand totals; state vs inter-state GST breakdown can be expanded for complex multi-state taxation.
