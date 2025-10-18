# Constructify Frontend

A React-based frontend application for the Constructify platform with user registration, email verification, and authentication features.

## Features

- **User Registration**: Complete signup form with validation
- **Email Verification**: 6-digit code verification system
- **Password Management**: Secure password handling with confirmation
- **Responsive Design**: Mobile-friendly interface
- **API Integration**: Seamless backend communication

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. The application will open at `http://localhost:3000`

## Components

### Signup Component (`src/Signup.js`)
- Full name, email, password, and password confirmation fields
- Real-time form validation
- Password visibility toggle
- Social login buttons (Google & Microsoft)
- API integration for user registration

### Email Verification Component (`src/EmailVerification.js`)
- 6-digit verification code input
- Countdown timer (15 minutes)
- Resend code functionality
- Back to signup option

### App Component (`src/App.js`)
- Main application flow management
- State management for signup process
- Dashboard view after successful verification

## API Integration

The frontend integrates with the Laravel backend API:

- **Registration**: `POST /api/register`
- **Email Verification**: `POST /api/verify-email`
- **Login**: `POST /api/login`
- **Forgot Password**: `POST /api/forgot-password`
- **Reset Password**: `POST /api/reset-password`

## Styling

- Custom CSS with modern design
- Responsive layout for all screen sizes
- Smooth animations and transitions
- Professional construction-themed design

## User Flow

1. **Signup**: User fills out registration form
2. **Verification**: User receives email with verification code
3. **Dashboard**: User is redirected to dashboard after verification
4. **Authentication**: User can login with verified credentials

## Development

The application uses:
- React 19.2.0
- Axios for API calls
- CSS3 for styling
- Modern JavaScript (ES6+)

## Testing

To test the complete flow:
1. Fill out the signup form
2. Check browser console or Laravel logs for verification code
3. Enter the verification code
4. Access the dashboard

Note: Verification codes are logged to `storage/logs/laravel.log` for development testing.