# 🔒 Security Documentation

## Role-Based Access Control (RBAC)

Constructify implements a secure role-based system with two roles: **Admin** and **Employee**.

---

## 🛡️ Security Model

### Key Principles:

1. **No Self-Promotion** ❌
   - Users **cannot** select their role during registration
   - All new signups are automatically assigned the **Employee** role
   - Role dropdown has been **removed** from the signup form

2. **Admin-Only Promotion** ✅
   - Only existing admins can promote users to admin role
   - Requires authentication + admin middleware
   - Protected endpoint: `POST /api/admin/update-role`

3. **System Protection** 🛡️
   - Cannot demote the last admin (prevents lockout)
   - First admin must be created via secure command line
   - Role changes are logged and auditable

---

## 🚀 Quick Start: Create Your First Admin

### Step 1: Run the Admin Creation Command
```bash
cd backend
php artisan make:admin
```

### Step 2: Enter Admin Details
```
Creating Admin User...

Full Name: John Admin
Email: admin@example.com
Password (min 8 characters): ********

✓ Admin user created successfully!

┌────────┬───────────────────┐
│ Field  │ Value             │
├────────┼───────────────────┤
│ ID     │ 1                 │
│ Name   │ John Admin        │
│ Email  │ admin@example.com │
│ Role   │ admin             │
│ Status │ Verified          │
└────────┴───────────────────┘
```

### Step 3: Login to Your App
- Navigate to your frontend (http://localhost:3000)
- Login with your admin credentials
- You'll see an "Admin" badge on the dashboard

---

## 👥 Promoting Users to Admin

### As an Admin:

1. **Login** with your admin account
2. **Get the user ID** you want to promote (view all users: `GET /api/admin/users`)
3. **Make the API call:**

```bash
curl -X POST http://localhost:8002/api/admin/update-role \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 2,
    "role": "admin"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User role updated successfully",
  "data": {
    "user": {
      "id": 2,
      "fullname": "Jane Doe",
      "email": "jane@example.com",
      "role": "admin"
    }
  }
}
```

---

## 🔑 Admin Endpoints

All admin endpoints require:
- ✅ Valid authentication token (`Authorization: Bearer TOKEN`)
- ✅ User role = 'admin'

### Available Admin Routes:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | View all users |
| POST | `/api/admin/update-role` | Promote/demote users |

**Example - View All Users:**
```bash
curl -X GET http://localhost:8002/api/admin/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 🚫 What's Protected

### ❌ Users CANNOT:
- Select "Admin" role during signup
- Promote themselves to admin
- Access admin endpoints without admin role
- Demote the last admin in the system

### ✅ Only Admins CAN:
- View all users in the system
- Promote users to admin
- Demote admins to employee (except last admin)
- Access `/api/admin/*` routes

---

## 🎯 Role Assignment Flow

```
┌─────────────────────────────────────────────────────┐
│                   NEW USER SIGNUP                    │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
         ┌─────────────────────────┐
         │   Role = "employee"     │  ← FORCED (no choice)
         │   is_verified = false   │
         └────────────┬────────────┘
                      │
                      ▼
         ┌─────────────────────────┐
         │  Email Verification     │
         └────────────┬────────────┘
                      │
                      ▼
         ┌─────────────────────────┐
         │   Login as Employee     │
         └────────────┬────────────┘
                      │
                      ▼
         ┌─────────────────────────┐
         │  Admin promotes user?   │
         └────────────┬────────────┘
                      │
           ┌──────────┴──────────┐
           │                     │
          YES                   NO
           │                     │
           ▼                     ▼
    ┌───────────┐        ┌──────────────┐
    │   Admin   │        │   Employee   │
    └───────────┘        └──────────────┘
```

---

## 🧪 Testing Security

### Test 1: Try to Register as Admin
**Expected Result:** ❌ No role dropdown visible on signup page

### Test 2: Try to Access Admin Endpoint as Employee
```bash
curl -X GET http://localhost:8002/api/admin/users \
  -H "Authorization: Bearer EMPLOYEE_TOKEN"
```
**Expected Result:** ❌ `403 Forbidden` - "You do not have permission to access this resource"

### Test 3: Try to Demote Last Admin
```bash
curl -X POST http://localhost:8002/api/admin/update-role \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "role": "employee"}'
```
**Expected Result:** ❌ `400 Bad Request` - "Cannot demote the only admin"

### Test 4: Admin Promotes User
```bash
curl -X POST http://localhost:8002/api/admin/update-role \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id": 2, "role": "admin"}'
```
**Expected Result:** ✅ `200 OK` - User promoted successfully

---

## 📊 Database Schema

### users table:
```sql
role ENUM('admin', 'employee') DEFAULT 'employee'
```

- **Default:** employee
- **Required:** Yes
- **Validation:** Must be 'admin' or 'employee'

---

## 🔍 Audit Trail

All role changes should be logged. Check logs at:
```
backend/storage/logs/laravel.log
```

---

## 🆘 Emergency Admin Access

If you lose admin access:

### Option 1: Create New Admin via Command
```bash
cd backend
php artisan make:admin
```

### Option 2: Database Direct Update (NOT RECOMMENDED)
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

⚠️ **Warning:** Only use direct database access in emergencies!

---

## ✅ Security Checklist

- [x] Role dropdown removed from signup
- [x] Backend enforces employee role for new users
- [x] Admin promotion requires authentication + admin role
- [x] Last admin cannot be demoted
- [x] All admin routes protected with middleware
- [x] Role returned in all auth responses
- [x] Google OAuth users default to employee
- [x] Artisan command for creating admins
- [x] No public admin creation endpoints

---

## 📚 Related Documentation

- [ROLES_DOCUMENTATION.md](./ROLES_DOCUMENTATION.md) - Complete RBAC guide
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API endpoint reference

---

## 🐛 Reporting Security Issues

If you discover a security vulnerability, please email: security@constructify.com

**DO NOT** create public issues for security vulnerabilities.

---

Last Updated: October 11, 2025

