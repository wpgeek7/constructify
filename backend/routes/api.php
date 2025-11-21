<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\JobController;
use App\Http\Controllers\Api\AIAnalysisController;
use App\Http\Controllers\Api\PlanController;
use App\Http\Controllers\Api\DisciplineController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public authentication routes

// ============================================
// 📱 PHONE NUMBER AUTHENTICATION (PRIMARY)
// ============================================
Route::post('/auth/phone/register', [AuthController::class, 'registerWithPhone']);
Route::post('/auth/phone/verify', [AuthController::class, 'verifyPhoneOTP']);
Route::post('/auth/phone/login', [AuthController::class, 'loginWithPhone']);
Route::post('/auth/phone/send-login-otp', [AuthController::class, 'sendLoginOTP']);
Route::post('/auth/phone/resend-otp', [AuthController::class, 'resendPhoneOTP']);

// ============================================
// 📧 EMAIL AUTHENTICATION (SECONDARY)
// ============================================
Route::post('/register', [AuthController::class, 'register']);
Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// ============================================
// 🔐 SOCIAL AUTHENTICATION
// ============================================
Route::post('/google-auth', [AuthController::class, 'googleAuth']);

// ============================================
// 🔓 DEV MODE: ALL ROUTES PUBLIC (NO AUTH)
// ============================================
// WARNING: REMOVE THIS IN PRODUCTION AND UNCOMMENT AUTH MIDDLEWARE BELOW

Route::post('/logout', [AuthController::class, 'logout']);
Route::get('/me', [AuthController::class, 'me']);
Route::put('/profile/update', [AuthController::class, 'updateProfile']);
Route::get('/user', function (Request $request) {
    return $request->user();
});

// Admin routes
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

// AI Analysis Routes
Route::post('/uploads/{id}/analyze', [AIAnalysisController::class, 'analyzePhoto']);
Route::get('/uploads/{id}/analysis', [AIAnalysisController::class, 'getAnalysis']);
Route::post('/uploads/{id}/reanalyze', [AIAnalysisController::class, 'reanalyzePhoto']);
Route::get('/jobs/{id}/ai-stats', [AIAnalysisController::class, 'getJobAIStats']);

// Employee Job Access
Route::get('/my-jobs', [JobController::class, 'myJobs']);
Route::post('/jobs/{id}/update-status', [JobController::class, 'updateStatus']);

// Time Tracking
Route::post('/jobs/{id}/log-time', [JobController::class, 'logTime']);

// File Uploads
Route::post('/jobs/{id}/upload-file', [JobController::class, 'uploadFile']);

// File Downloads
Route::get('/uploads/{uploadId}/download', [JobController::class, 'downloadFile']);

// Plan Management
Route::get('/plans', [PlanController::class, 'index']); // List all plans
Route::post('/plans', [PlanController::class, 'store']); // Upload plan
Route::get('/plans/{id}', [PlanController::class, 'show']); // View plan details
Route::get('/plans/{id}/file', [PlanController::class, 'serveFile']); // Serve plan file
Route::put('/plans/{id}/pages', [PlanController::class, 'updatePages']); // Update total pages
Route::post('/plans/{id}/regenerate-thumbnail', [PlanController::class, 'regenerateThumbnail']); // Regenerate thumbnail
Route::delete('/plans/{id}', [PlanController::class, 'destroy']); // Delete plan

// Measurements
Route::post('/plans/{planId}/measurements', [PlanController::class, 'saveMeasurements']);
Route::get('/plans/{planId}/measurements', [PlanController::class, 'getMeasurements']);
Route::delete('/measurements/{id}', [PlanController::class, 'deleteMeasurement']);

// Disciplines
Route::get('/plans/{planId}/disciplines', [DisciplineController::class, 'index']);
Route::post('/plans/{planId}/disciplines', [DisciplineController::class, 'store']);
Route::put('/plans/{planId}/disciplines/{id}', [DisciplineController::class, 'update']);
Route::delete('/plans/{planId}/disciplines/{id}', [DisciplineController::class, 'destroy']);
Route::post('/plans/{planId}/disciplines/reorder', [DisciplineController::class, 'reorder']);

// Collaborators & Teams
Route::get('/plans/{planId}/collaborators', [\App\Http\Controllers\Api\CollaboratorController::class, 'getPlanCollaborators']);
Route::post('/plans/{planId}/collaborators', [\App\Http\Controllers\Api\CollaboratorController::class, 'addCollaborator']);
Route::put('/plans/{planId}/collaborators/{id}', [\App\Http\Controllers\Api\CollaboratorController::class, 'updateCollaboratorRole']);
Route::delete('/plans/{planId}/collaborators/{id}', [\App\Http\Controllers\Api\CollaboratorController::class, 'removeCollaborator']);

Route::get('/plans/{planId}/teams', [\App\Http\Controllers\Api\CollaboratorController::class, 'getPlanTeams']);
Route::post('/plans/{planId}/teams', [\App\Http\Controllers\Api\CollaboratorController::class, 'assignTeamToPlan']);
Route::delete('/plans/{planId}/teams/{teamId}', [\App\Http\Controllers\Api\CollaboratorController::class, 'removeTeamFromPlan']);

Route::get('/teams', [\App\Http\Controllers\Api\CollaboratorController::class, 'getAllTeams']);
Route::post('/teams', [\App\Http\Controllers\Api\CollaboratorController::class, 'createTeam']);

/*
// ============================================
// 🔒 PRODUCTION: ENABLE AUTHENTICATION
// ============================================
// Uncomment this section and remove the public routes above for production

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
        Route::get('/roles', [RoleController::class, 'index']);
        Route::post('/roles', [RoleController::class, 'store']);
        Route::get('/roles/{id}', [RoleController::class, 'show']);
        Route::put('/roles/{id}', [RoleController::class, 'update']);
        Route::delete('/roles/{id}', [RoleController::class, 'destroy']);
        Route::get('/employees', [EmployeeController::class, 'index']);
        Route::post('/employees', [EmployeeController::class, 'store']);
        Route::get('/employees/{id}', [EmployeeController::class, 'show']);
        Route::put('/employees/{id}', [EmployeeController::class, 'update']);
        Route::delete('/employees/{id}', [EmployeeController::class, 'destroy']);
        Route::post('/employees/{id}/approve', [EmployeeController::class, 'updateApprovalStatus']);
        Route::post('/employees/bulk-upload', [EmployeeController::class, 'bulkUpload']);
        Route::get('/jobs', [JobController::class, 'index']);
        Route::post('/jobs', [JobController::class, 'store']);
        Route::get('/jobs/{id}', [JobController::class, 'show']);
        Route::put('/jobs/{id}', [JobController::class, 'update']);
        Route::delete('/jobs/{id}', [JobController::class, 'destroy']);
        Route::post('/jobs/bulk-upload', [JobController::class, 'bulkUpload']);
        Route::get('/jobs/{id}/employee-locations', [JobController::class, 'getEmployeeLocations']);
        Route::post('/uploads/{id}/analyze', [AIAnalysisController::class, 'analyzePhoto']);
        Route::get('/uploads/{id}/analysis', [AIAnalysisController::class, 'getAnalysis']);
        Route::post('/uploads/{id}/reanalyze', [AIAnalysisController::class, 'reanalyzePhoto']);
        Route::get('/jobs/{id}/ai-stats', [AIAnalysisController::class, 'getJobAIStats']);
        Route::post('/plans', [PlanController::class, 'store']);
        Route::delete('/plans/{id}', [PlanController::class, 'destroy']);
    });

    // Routes accessible by both admin and employee
    Route::middleware('role:admin,employee')->group(function () {
        Route::get('/my-jobs', [JobController::class, 'myJobs']);
        Route::post('/jobs/{id}/update-status', [JobController::class, 'updateStatus']);
        Route::post('/jobs/{id}/log-time', [JobController::class, 'logTime']);
        Route::post('/jobs/{id}/upload-file', [JobController::class, 'uploadFile']);
        Route::get('/uploads/{uploadId}/download', [JobController::class, 'downloadFile']);
        Route::get('/plans', [PlanController::class, 'index']);
        Route::get('/plans/{id}', [PlanController::class, 'show']);
        Route::get('/plans/{id}/file', [PlanController::class, 'serveFile']);
        Route::put('/plans/{id}/pages', [PlanController::class, 'updatePages']);
        Route::post('/plans/{planId}/measurements', [PlanController::class, 'saveMeasurements']);
        Route::get('/plans/{planId}/measurements', [PlanController::class, 'getMeasurements']);
        Route::delete('/measurements/{id}', [PlanController::class, 'deleteMeasurement']);
        Route::get('/plans/{planId}/disciplines', [DisciplineController::class, 'index']);
        Route::post('/plans/{planId}/disciplines', [DisciplineController::class, 'store']);
        Route::put('/plans/{planId}/disciplines/{id}', [DisciplineController::class, 'update']);
        Route::delete('/plans/{planId}/disciplines/{id}', [DisciplineController::class, 'destroy']);
        Route::post('/plans/{planId}/disciplines/reorder', [DisciplineController::class, 'reorder']);
    });
});
*/
