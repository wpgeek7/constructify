# Constructify API Documentation

## Authentication API Endpoints

### Base URL
```
http://localhost:8000/api
```

### 1. User Registration
**POST** `/register`

Register a new user with email verification.

**Request Body:**
```json
{
    "fullname": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "password_confirmation": "password123"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Registration successful. Please check your email for verification code.",
    "data": {
        "user_id": 1,
        "email": "john@example.com",
        "expires_at": "2025-10-08T09:55:17.477403Z"
    }
}
```

**Note:** Verification code is logged to `storage/logs/laravel.log` for testing purposes.

---

### 2. Email Verification
**POST** `/verify-email`

Verify user's email with the verification code sent during registration.

**Request Body:**
```json
{
    "email": "john@example.com",
    "verification_code": "5aiD93"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Email verified successfully",
    "data": {
        "user": {
            "id": 1,
            "fullname": "John Doe",
            "email": "john@example.com",
            "is_verified": true
        },
        "token": "1|gewNUF3jwEzCTL9bWnjFkmDbj7sVyaUPn2DvbM9g049ed587",
        "redirect_to": "dashboard"
    }
}
```

---

### 3. User Login
**POST** `/login`

Login with email and password.

**Request Body:**
```json
{
    "email": "john@example.com",
    "password": "password123"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "user": {
            "id": 1,
            "fullname": "John Doe",
            "email": "john@example.com",
            "is_verified": true
        },
        "token": "2|3oqHybmMEs94rZsdSV9JnwfWnsFUagwCwrfUFTgbdfe63bb5",
        "redirect_to": "dashboard"
    }
}
```

---

### 4. Forgot Password
**POST** `/forgot-password`

Send password reset code to user's email.

**Request Body:**
```json
{
    "email": "john@example.com"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Password reset code sent to your email",
    "data": {
        "email": "john@example.com",
        "expires_at": "2025-10-08T09:55:43.522068Z"
    }
}
```

---

### 5. Reset Password
**POST** `/reset-password`

Reset password using the verification code from forgot password email.

**Request Body:**
```json
{
    "email": "john@example.com",
    "verification_code": "KgxVbm",
    "password": "newpassword123",
    "password_confirmation": "newpassword123"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Password reset successfully",
    "data": {
        "email": "john@example.com"
    }
}
```

---

### 6. Get User Profile (Protected)
**GET** `/me`

Get authenticated user's profile information.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
Accept: application/json
```

**Response:**
```json
{
    "success": true,
    "data": {
        "user": {
            "id": 1,
            "fullname": "John Doe",
            "email": "john@example.com",
            "is_verified": true
        }
    }
}
```

---

### 7. Logout (Protected)
**POST** `/logout`

Logout and invalidate the current token.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
Accept: application/json
```

**Response:**
```json
{
    "success": true,
    "message": "Logged out successfully"
}
```

---

## Authentication Flow

1. **Registration**: User registers with fullname, email, password, and password confirmation
2. **Email Verification**: User receives verification code via email (logged for testing)
3. **Verification**: User submits verification code to complete registration
4. **Login**: User can now login with email and password
5. **Dashboard**: User is redirected to dashboard after successful login

## Password Reset Flow

1. **Forgot Password**: User requests password reset with email
2. **Reset Code**: User receives reset code via email (logged for testing)
3. **Reset Password**: User submits reset code with new password
4. **Login**: User can login with new password

## Error Responses

All endpoints return consistent error responses:

```json
{
    "success": false,
    "message": "Error message",
    "errors": {
        "field_name": ["Validation error message"]
    }
}
```

## Testing Notes

- Verification codes are logged to `storage/logs/laravel.log` for testing
- All verification codes expire in 15 minutes
- Tokens are required for protected endpoints
- Server runs on `http://localhost:8000`
