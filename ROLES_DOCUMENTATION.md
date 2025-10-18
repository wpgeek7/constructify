# Role-Based Access Control (RBAC) Documentation

## Overview
Constructify now supports two user roles: **Admin** and **Employee**.

### 🔒 Security Model:
- ✅ **All new registrations are EMPLOYEE by default**
- ✅ **Only existing Admins can promote users to Admin**
- ✅ **Cannot demote the last admin** (system protection)
- ✅ **First admin must be created via command line**

---

## Database Schema

### Users Table
- `role` (enum): 'admin' or 'employee' (default: 'employee')

---

## Backend Implementation

### 1. User Model (`app/Models/User.php`)

**Helper Methods:**
```php
$user->isAdmin()     // Returns true if user is admin
$user->isEmployee()  // Returns true if user is employee
```

**Role Field:**
- Included in fillable fields
- Returned in all API responses

---

### 2. Role Middleware (`app/Http/Middleware/CheckRole.php`)

Checks if authenticated user has required role(s).

**Usage in Routes:**
```php
// Admin only
Route::middleware('role:admin')->group(function () {
    Route::get('/admin/users', ...);
});

// Multiple roles
Route::middleware('role:admin,employee')->group(function () {
    Route::get('/projects', ...);
});
```

---

### 3. API Responses

All authentication endpoints now include `role` field:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "fullname": "John Doe",
      "email": "john@example.com",
      "role": "admin",
      "is_verified": true
    },
    "token": "..."
  }
}
```

---

## Frontend Implementation

### 1. Signup Page

Users can select their role during registration:
- **Dropdown** with "Employee" (default) and "Admin" options
- Role is sent to `/api/register` endpoint

### 2. Dashboard

Displays user role with **colored badge**:
- **Admin**: Yellow badge (#fef3c7 background)
- **Employee**: Blue badge (#dbeafe background)

### 3. Authentication

Role is automatically included in:
- Registration responses
- Login responses
- Google OAuth responses
- Email verification responses
- `/api/me` endpoint

---

## Example Routes

### Protected Routes (All Authenticated Users)
```php
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
});
```

### Admin-Only Routes
```php
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/admin/users', function () {
        return User::all(); // Only admins can see all users
    });
    Route::post('/admin/settings', ...);
    Route::delete('/admin/users/{id}', ...);
});
```

### Multi-Role Routes
```php
Route::middleware(['auth:sanctum', 'role:admin,employee'])->group(function () {
    Route::get('/projects', ...);
    Route::get('/tasks', ...);
});
```

---

## Creating Your First Admin

### ⚡ Quick Method (Recommended)
Use the artisan command to create your first admin user:

```bash
cd backend
php artisan make:admin
```

**Interactive prompts:**
```
Creating Admin User...

Full Name: John Admin
Email: admin@example.com
Password (min 8 characters): ********

✓ Admin user created successfully!
```

### 🔧 With Options
```bash
php artisan make:admin --name="John Admin" --email="admin@example.com" --password="SecurePass123"
```

### 📝 Manual Method (Database Seeder)
```php
// database/seeders/DatabaseSeeder.php
User::create([
    'name' => 'Admin User',
    'fullname' => 'Admin User',
    'email' => 'admin@example.com',
    'password' => Hash::make('password'),
    'role' => 'admin',
    'is_verified' => true,
    'email_verified_at' => now()
]);
```

Then run:
```bash
php artisan db:seed
```

---

## Promoting Users to Admin

### 🔑 Admin Endpoint
Once you have an admin, they can promote other users:

**Endpoint:** `POST /api/admin/update-role`

**Headers:**
```
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**Body:**
```json
{
  "user_id": 2,
  "role": "admin"
}
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

### 🛡️ Protection Features:
- ✅ Only admins can access this endpoint
- ✅ Cannot demote the last admin
- ✅ Validates user existence
- ✅ Only accepts 'admin' or 'employee' roles

---

## Testing

### Test Role Middleware
```bash
# Login as admin
curl -X POST http://localhost:8002/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Access admin route (should succeed)
curl -X GET http://localhost:8002/api/admin/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Login as employee
curl -X POST http://localhost:8002/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"employee@example.com","password":"password"}'

# Try to access admin route (should fail with 403)
curl -X GET http://localhost:8002/api/admin/users \
  -H "Authorization: Bearer YOUR_EMPLOYEE_TOKEN"
```

---

## Frontend Role Checking

### Check User Role in Components
```javascript
// In any component with access to authData
if (authData.user.role === 'admin') {
  // Show admin-only features
}

if (authData.user.role === 'employee') {
  // Show employee features
}
```

### Conditional Rendering Example
```jsx
{authData.user.role === 'admin' && (
  <button onClick={handleAdminAction}>Admin Panel</button>
)}

{authData.user.role === 'employee' && (
  <div>Employee Dashboard</div>
)}
```

---

## Migration Files

1. `2025_10_11_181721_add_role_to_users_table.php` - Adds role column
2. `2025_10_11_171409_add_google_id_to_users_table.php` - Adds Google OAuth support

---

## Security Notes

### 🔐 Key Security Features:

1. **No Self-Promotion** ❌
   - Users CANNOT select their role during signup
   - Role dropdown removed from registration form
   - All registrations are forced to 'employee' role

2. **Admin-Only Promotion** ✅
   - Only existing admins can promote users
   - Requires authentication + admin role middleware
   - Endpoint: `POST /api/admin/update-role`

3. **Last Admin Protection** 🛡️
   - Cannot demote the last admin in the system
   - Prevents system lockout
   - Must promote another admin first

4. **Backend Enforcement** 🔒
   - Role validation happens on backend
   - Frontend checks are for UI only
   - Middleware protects all admin routes

5. **First Admin Creation** 🔑
   - Must use command: `php artisan make:admin`
   - Or database seeder
   - Cannot be created via public registration

6. **Consistent Defaults** 📋
   - New users → Employee
   - Google OAuth → Employee
   - Database default → Employee

### ⚠️ Security Warnings:

- **DO NOT** allow users to send `role` parameter during signup
- **DO NOT** trust frontend role checks for authorization
- **ALWAYS** use backend middleware for role verification
- **NEVER** expose admin creation endpoints publicly

---

## Future Enhancements

1. Add more granular permissions (beyond just roles)
2. Create admin panel to manage user roles
3. Add role change history/audit log
4. Implement role-based UI navigation
5. Add "Super Admin" role for multi-tenant support

---

## Files Modified

### Backend:
- `app/Models/User.php` - Added role field and helper methods
- `app/Http/Middleware/CheckRole.php` - Role-based access control
- `app/Http/Controllers/Api/AuthController.php` - Force employee role, add updateUserRole()
- `app/Console/Commands/CreateAdminUser.php` - **NEW:** Command to create admin users
- `bootstrap/app.php` - Register role middleware
- `routes/api.php` - Add admin routes with protection
- `database/migrations/2025_10_11_181721_add_role_to_users_table.php` - Add role column

### Frontend:
- `src/Signup.js` - **REMOVED:** Role dropdown (security fix)
- `src/Signup.css` - Removed role select styles (no longer needed)
- `src/App.js` - Display user role with badge
- `src/App.css` - Add role badge styling

---

Last Updated: October 11, 2025

