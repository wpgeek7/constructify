<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\JobController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public authentication routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::post('/google-auth', [AuthController::class, 'googleAuth']);

// Protected routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile/update', [AuthController::class, 'updateProfile']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Admin-only routes
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/users', function (Request $request) {
            return response()->json([
                'success' => true,
                'message' => 'Admin access granted',
                'data' => \App\Models\User::select('id', 'fullname', 'email', 'role', 'is_verified', 'created_at')->get()
            ]);
        });
        Route::post('/admin/update-role', [AuthController::class, 'updateUserRole']);

        // Role Management (CRUD)
        Route::get('/roles', [RoleController::class, 'index']);
        Route::post('/roles', [RoleController::class, 'store']);
        Route::get('/roles/{id}', [RoleController::class, 'show']);
        Route::put('/roles/{id}', [RoleController::class, 'update']);
        Route::delete('/roles/{id}', [RoleController::class, 'destroy']);

        // Employee Management (CRUD + Approval + CSV)
        Route::get('/employees', [EmployeeController::class, 'index']);
        Route::post('/employees', [EmployeeController::class, 'store']);
        Route::get('/employees/{id}', [EmployeeController::class, 'show']);
        Route::put('/employees/{id}', [EmployeeController::class, 'update']);
        Route::delete('/employees/{id}', [EmployeeController::class, 'destroy']);
        Route::post('/employees/{id}/approve', [EmployeeController::class, 'updateApprovalStatus']);
        Route::post('/employees/bulk-upload', [EmployeeController::class, 'bulkUpload']);

        // Job Management (Admin CRUD + CSV)
        Route::get('/jobs', [JobController::class, 'index']);
        Route::post('/jobs', [JobController::class, 'store']);
        Route::get('/jobs/{id}', [JobController::class, 'show']);
        Route::put('/jobs/{id}', [JobController::class, 'update']);
        Route::delete('/jobs/{id}', [JobController::class, 'destroy']);
        Route::post('/jobs/bulk-upload', [JobController::class, 'bulkUpload']);
        Route::get('/jobs/{id}/employee-locations', [JobController::class, 'getEmployeeLocations']);
    });

    // Routes accessible by both admin and employee
    Route::middleware('role:admin,employee')->group(function () {
        // Employee Job Access
        Route::get('/my-jobs', [JobController::class, 'myJobs']); // Get assigned jobs
        Route::get('/jobs/{id}', [JobController::class, 'show']); // View job details
        Route::post('/jobs/{id}/update-status', [JobController::class, 'updateStatus']); // Update job status

        // Time Tracking
        Route::post('/jobs/{id}/log-time', [JobController::class, 'logTime']); // Start/pause/stop timer

        // File Uploads
        Route::post('/jobs/{id}/upload-file', [JobController::class, 'uploadFile']); // Upload image/PDF/audio

        // File Downloads
        Route::get('/uploads/{uploadId}/download', [JobController::class, 'downloadFile']); // Download uploaded file
    });
});
