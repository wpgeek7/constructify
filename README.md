# Constructify

A full-stack construction site management application built with Laravel backend and React frontend.

## Project Overview

Constructify is designed to manage construction sites including manpower and project reports. This application provides a modern web interface for construction project management.

## Technology Stack

### Backend
- **Laravel 12.x** - PHP framework for API development
- **MySQL/SQLite** - Database (SQLite configured by default)
- **Laravel Sanctum** - API authentication (ready to configure)

### Frontend
- **React 18.x** - Modern JavaScript library for UI
- **Create React App** - Development toolchain
- **Modern ES6+** - Latest JavaScript features

## Project Structure

```
constructify/
├── backend/                 # Laravel API backend
│   ├── app/                # Application logic
│   ├── config/             # Configuration files
│   ├── database/           # Database migrations and seeds
│   ├── routes/             # API routes
│   ├── storage/            # File storage
│   ├── .env                # Environment configuration
│   └── composer.json       # PHP dependencies
├── frontend/               # React frontend
│   ├── public/             # Static assets
│   ├── src/                # React components and logic
│   ├── package.json        # Node.js dependencies
│   └── README.md           # Frontend documentation
└── README.md               # This file
```

## Getting Started

### Prerequisites
- PHP 8.2+ with Composer
- Node.js 16+ with npm
- MySQL (optional, SQLite works out of the box)

### Backend Setup (Laravel)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   composer install
   ```

3. Configure environment (optional):
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. Run migrations:
   ```bash
   php artisan migrate
   ```

5. Start the development server:
   ```bash
   php artisan serve
   ```
   The API will be available at `http://localhost:8000`

### Frontend Setup (React)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```
   The React app will be available at `http://localhost:3000`

## Development Workflow

1. **Backend Development**: Work in the `backend/` directory with Laravel
2. **Frontend Development**: Work in the `frontend/` directory with React
3. **API Integration**: Configure CORS in Laravel to allow React frontend requests
4. **Database**: Use Laravel migrations for database schema management

## Next Steps

- Configure API authentication with Laravel Sanctum
- Set up CORS for frontend-backend communication
- Create API routes for construction site management
- Build React components for the user interface
- Implement database models for construction sites, manpower, and reports

## Contributing

This is a new project setup. The basic structure is ready for development of construction site management features.

## License

This project is for construction site management purposes.