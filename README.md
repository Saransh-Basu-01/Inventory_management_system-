# 📦 Inventory Management System

A modern, full-stack Inventory Management System built with **FastAPI** (Backend) and **React + TypeScript** (Frontend). Features role-based access control, beautiful UI with animations, and comprehensive inventory tracking. 

---

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Manager, Staff)
- Secure password hashing
- Protected routes

### 👥 User Roles
| Role | Permissions |
|------|-------------|
| **Admin** | Full access - Create, Read, Update, Delete, Manage Users |
| **Manager** | Create, Read, Update (No Delete, No User Management) |
| **Staff** | Read Only (View all data, no modifications) |

### 📊 Core Modules
- **Products** - Manage product catalog with SKU, pricing, and stock levels
- **Categories** - Organize products into categories
- **Suppliers** - Track supplier information with Nepali phone validation
- **Inventory** - Record stock movements (Stock In, Stock Out, Adjustments, Returns)
- **Sales** - Process and track sales transactions
- **Users** - Admin panel for user management

### 🎨 Modern UI/UX
- Beautiful login/register pages with animations
- Responsive design (mobile-friendly)
- Role-based UI (buttons hidden based on permissions)
- Real-time form validation
- Toast notifications

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **Pydantic** - Data validation
- **JWT (python-jose)** - Token-based authentication
- **SQLite/PostgreSQL** - Database

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn/ui** - UI components
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Framer Motion** - Animations
- **Axios** - HTTP client
- **React Router** - Navigation

---

## 📁 Project Structure

```
Inventory_management_system-/
├── Backend/
│   ├── App/
│   │   ├── models/          # SQLAlchemy models
│   │   ├── routes/          # API endpoints
│   │   │   ├── auth.py      # Authentication routes
│   │   │   ├── product.py   # Product CRUD
│   │   │   ├── category.py  # Category CRUD
│   │   │   ├── supplier.py  # Supplier CRUD
│   │   │   ├── sale.py      # Sales routes
│   │   │   └── inventory_transaction.py
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── curd/            # Database operations
│   │   ├── database.py      # Database configuration
│   │   └── main.py          # FastAPI app entry
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── api/             # API client
│   │   ├── components/      # Reusable components
│   │   │   ├── ui/          # Shadcn components
│   │   │   ├── layout/      # Layout components
│   │   │   └── RoleGuard.tsx
│   │   ├── context/         # React context
│   │   │   └── AuthContext.tsx
│   │   ├── pages/           # Page components
│   │   │   ├── Login. tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Products.tsx
│   │   │   ├── Categories.tsx
│   │   │   ├── Supplier.tsx
│   │   │   ├── Inventory.tsx
│   │   │   ├── Sale.tsx
│   │   │   └── Users.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package. json
│   └── tailwind.config.js
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
# Navigate to backend
cd Backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows: 
venv\Scripts\activate
# macOS/Linux: 
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn App.main:app --reload
```

Backend will be running at: `http://localhost:8000`

API Documentation: `http://localhost:8000/docs`

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will be running at:  `http://localhost:5173`

---

## 🔧 Initial Setup

### Create First Admin User

1. Go to `http://localhost:8000/docs`
2. Find `POST /api/v1/auth/create-admin`
3. Enter credentials: 
   - username: `admin`
   - email: `admin@example.com`
   - password: `Admin123`
4. Execute

### Login

1. Go to `http://localhost:5173/login`
2. Enter admin credentials
3. Start managing your inventory!

---

## 📸 Screenshots

### Login Page
Beautiful animated login with gradient background and floating particles. 

### Dashboard
Overview of inventory stats, recent sales, and low stock alerts.

### Products Management
Full CRUD operations with search, filter, and pagination.

### User Management (Admin Only)
Create users with specific roles, change roles on the fly.

---

## 🔒 API Endpoints

### Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/auth/register` | Register new user | Public |
| POST | `/auth/login` | Login & get token | Public |
| GET | `/auth/me` | Get current user | Authenticated |
| GET | `/auth/users` | List all users | Admin |
| POST | `/auth/users` | Create user with role | Admin |
| PATCH | `/auth/users/{id}/role` | Change user role | Admin |

### Products
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/products` | List products | Authenticated |
| POST | `/products` | Create product | Manager+ |
| PATCH | `/products/{id}` | Update product | Manager+ |
| DELETE | `/products/{id}` | Delete product | Admin |

### Categories
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/categories` | List categories | Authenticated |
| POST | `/categories` | Create category | Manager+ |
| PATCH | `/categories/{id}` | Update category | Manager+ |
| DELETE | `/categories/{id}` | Delete category | Admin |

### Suppliers
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/suppliers` | List suppliers | Authenticated |
| POST | `/suppliers` | Create supplier | Manager+ |
| PATCH | `/suppliers/{id}` | Update supplier | Manager+ |
| DELETE | `/suppliers/{id}` | Delete supplier | Admin |

### Inventory Transactions
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/inventory-transactions` | List transactions | Authenticated |
| POST | `/inventory-transactions` | Create transaction | Manager+ |

### Sales
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/sales` | List sales | Authenticated |
| GET | `/sales/{id}` | Get sale details | Authenticated |
| POST | `/sales` | Create sale | Manager+ |

---

## ✅ Validation Rules

### Email
- Valid email format (using Pydantic EmailStr)

### Phone (Nepali)
- Exactly 10 digits
- Must start with 98 or 97
- Accepts formats:  `9812345678`, `+977-9812345678`

### Password
- Minimum 6 characters
- At least one uppercase letter
- At least one number

---

## 🎨 Color Scheme

| Role | Color | Badge |
|------|-------|-------|
| Admin | Red | 🔴 |
| Manager | Blue | 🔵 |
| Staff | Gray | ⚪ |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Saransh Basu**
- GitHub: [@Saransh-Basu-01](https://github.com/Saransh-Basu-01)

---

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn/ui](https://ui.shadcn.com/)
- [Framer Motion](https://www.framer.com/motion/)

---

<p align="center">
  Made with ❤️ in Nepal 🇳🇵
</p>

<p align="center">
  ⭐ Star this repo if you found it helpful! 
</p>
