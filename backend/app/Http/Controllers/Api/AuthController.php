<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Carbon\Carbon;

class AuthController extends Controller
{
    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'fullname' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors()
            ], 422);
        }

        // Generate verification code
        $verificationCode = Str::random(6);
        $expiresAt = Carbon::now()->addMinutes(15); // Code expires in 15 minutes

        // Create user (always as employee for security)
        $user = User::create([
            'name' => $request->fullname, // Laravel's default name field
            'fullname' => $request->fullname,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'employee', // Force employee role - only admins can promote users
            'approval_status' => 'pending', // New signups need admin approval
            'availability_status' => 'available',
            'verification_code' => $verificationCode,
            'verification_code_expires_at' => $expiresAt,
            'is_verified' => false,
        ]);

        // Send verification email
        $this->sendVerificationEmail($user->email, $verificationCode);

        return response()->json([
            'success' => true,
            'message' => 'Registration successful. Please check your email for verification code.',
            'data' => [
                'user_id' => $user->id,
                'email' => $user->email,
                'expires_at' => $expiresAt->toISOString()
            ]
        ], 201);
    }

    /**
     * Verify email with verification code
     */
    public function verifyEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'verification_code' => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }

        if ($user->is_verified) {
            return response()->json([
                'success' => false,
                'message' => 'Email already verified'
            ], 400);
        }

        if (strtoupper($user->verification_code) !== strtoupper($request->verification_code)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid verification code'
            ], 400);
        }

        if (Carbon::now()->gt($user->verification_code_expires_at)) {
            return response()->json([
                'success' => false,
                'message' => 'Verification code has expired'
            ], 400);
        }

        // Verify user
        $user->update([
            'is_verified' => true,
            'email_verified_at' => Carbon::now(),
            'verification_code' => null,
            'verification_code_expires_at' => null,
        ]);

        // Generate token for login
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Email verified successfully',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'fullname' => $user->fullname,
                    'email' => $user->email,
                    'role' => $user->role,
                    'is_verified' => $user->is_verified,
                ],
                'token' => $token,
                'redirect_to' => 'dashboard'
            ]
        ], 200);
    }

    /**
     * Login user
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ], 401);
        }

        if (!$user->is_verified) {
            return response()->json([
                'success' => false,
                'message' => 'Please verify your email before logging in'
            ], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'fullname' => $user->fullname,
                    'email' => $user->email,
                    'role' => $user->role,
                    'is_verified' => $user->is_verified,
                ],
                'token' => $token,
                'redirect_to' => 'dashboard'
            ]
        ], 200);
    }

    /**
     * Send forgot password email
     */
    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }

        // Generate reset code
        $resetCode = Str::random(6);
        $expiresAt = Carbon::now()->addMinutes(15); // Code expires in 15 minutes

        // Update user with reset code
        $user->update([
            'verification_code' => $resetCode,
            'verification_code_expires_at' => $expiresAt,
        ]);

        // Send reset email
        $this->sendPasswordResetEmail($user->email, $resetCode);

        return response()->json([
            'success' => true,
            'message' => 'Password reset code sent to your email',
            'data' => [
                'email' => $user->email,
                'expires_at' => $expiresAt->toISOString()
            ]
        ], 200);
    }

    /**
     * Reset password with verification code
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'verification_code' => 'required|string|size:6',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }

        if (strtoupper($user->verification_code) !== strtoupper($request->verification_code)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid reset code'
            ], 400);
        }

        if (Carbon::now()->gt($user->verification_code_expires_at)) {
            return response()->json([
                'success' => false,
                'message' => 'Reset code has expired'
            ], 400);
        }

        // Update password
        $user->update([
            'password' => Hash::make($request->password),
            'verification_code' => null,
            'verification_code_expires_at' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully',
            'data' => [
                'email' => $user->email
            ]
        ], 200);
    }

    /**
     * Google OAuth authentication
     */
    public function googleAuth(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'credential' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $client = new \Google_Client([
                'client_id' => '641924991963-vbpberb599gec6d2kuath2m3hmdr1792.apps.googleusercontent.com'
            ]);

            $payload = $client->verifyIdToken($request->credential);

            if (!$payload) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid Google token. Please try again.'
                ], 401);
            }

            $googleId = $payload['sub'];
            $email = $payload['email'];
            $name = $payload['name'];
            $emailVerified = $payload['email_verified'];

            // Find or create user
            $user = User::where('email', $email)->first();

            if (!$user) {
                // Create new user from Google account
                try {
                    $user = User::create([
                        'name' => $name, // Required field
                        'fullname' => $name,
                        'email' => $email,
                        'password' => Hash::make(Str::random(32)), // Random password for Google users
                        'role' => 'employee', // Default role for Google sign-ups
                        'approval_status' => 'pending', // New Google users need admin approval
                        'availability_status' => 'available',
                        'is_verified' => $emailVerified ? true : false,
                        'email_verified_at' => $emailVerified ? Carbon::now() : null,
                        'google_id' => $googleId
                    ]);
                } catch (\Exception $e) {
                    Log::error('Google authentication - User creation failed: ' . $e->getMessage());
                    return response()->json([
                        'success' => false,
                        'message' => 'Unable to create your account. Please try again or contact support.'
                    ], 500);
                }
            } else {
                // Update existing user with Google ID if not set
                if (!$user->google_id) {
                    try {
                        $user->update([
                            'google_id' => $googleId,
                            'is_verified' => true,
                            'email_verified_at' => Carbon::now()
                        ]);
                    } catch (\Exception $e) {
                        Log::error('Google authentication - User update failed: ' . $e->getMessage());
                        // Continue with login even if update fails
                    }
                }
            }

            // Generate token for login
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Google authentication successful',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'fullname' => $user->fullname,
                        'email' => $user->email,
                        'role' => $user->role,
                        'is_verified' => $user->is_verified,
                    ],
                    'token' => $token,
                    'redirect_to' => 'dashboard'
                ]
            ], 200);

        } catch (\Google_Exception $e) {
            Log::error('Google authentication - Token verification failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Google authentication failed. Please try again.'
            ], 401);
        } catch (\Exception $e) {
            Log::error('Google authentication - Unexpected error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'An unexpected error occurred. Please try again later.'
            ], 500);
        }
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully'
        ], 200);
    }

    /**
     * Get authenticated user
     */
    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $request->user()->id,
                    'fullname' => $request->user()->fullname,
                    'email' => $request->user()->email,
                    'role' => $request->user()->role,
                    'phone' => $request->user()->phone,
                    'address' => $request->user()->address,
                    'is_verified' => $request->user()->is_verified,
                ]
            ]
        ], 200);
    }

    /**
     * Update user profile
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'fullname' => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'current_password' => 'required_with:new_password',
            'new_password' => 'nullable|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors()
            ], 422);
        }

        // If changing password, verify current password
        if ($request->filled('new_password')) {
            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Current password is incorrect',
                    'errors' => [
                        'current_password' => ['Current password is incorrect']
                    ]
                ], 400);
            }

            $user->password = Hash::make($request->new_password);
        }

        // Update profile fields
        if ($request->filled('fullname')) {
            $user->fullname = $request->fullname;
            $user->name = $request->fullname; // Also update name field
        }

        if ($request->has('phone')) {
            $user->phone = $request->phone;
        }

        if ($request->has('address')) {
            $user->address = $request->address;
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'fullname' => $user->fullname,
                    'email' => $user->email,
                    'role' => $user->role,
                    'phone' => $user->phone,
                    'address' => $user->address,
                    'is_verified' => $user->is_verified,
                ]
            ]
        ], 200);
    }

    /**
     * Update user role (Admin only)
     */
    public function updateUserRole(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|integer|exists:users,id',
            'role' => 'required|in:admin,employee',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors()
            ], 422);
        }

        $targetUser = User::find($request->user_id);

        // Prevent self-demotion if you're the only admin
        if ($request->user()->id === $targetUser->id && $request->role === 'employee') {
            $adminCount = User::where('role', 'admin')->count();
            if ($adminCount <= 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot demote the only admin. Promote another user to admin first.'
                ], 400);
            }
        }

        $targetUser->update(['role' => $request->role]);

        return response()->json([
            'success' => true,
            'message' => 'User role updated successfully',
            'data' => [
                'user' => [
                    'id' => $targetUser->id,
                    'fullname' => $targetUser->fullname,
                    'email' => $targetUser->email,
                    'role' => $targetUser->role,
                ]
            ]
        ], 200);
    }

    /**
     * Send verification email
     */
    private function sendVerificationEmail($email, $code)
    {
        try {
            $expiresAt = Carbon::now()->addMinutes(15);
            Mail::to($email)->send(new \App\Mail\VerificationEmail($code, $expiresAt));
            Log::info("Verification email sent to {$email}");
        } catch (\Exception $e) {
            Log::error("Failed to send verification email to {$email}: " . $e->getMessage());
            // Still log the code for backup
            Log::info("Verification code for {$email}: {$code}");
        }
    }

    /**
     * Send password reset email
     */
    private function sendPasswordResetEmail($email, $code)
    {
        try {
            $expiresAt = Carbon::now()->addMinutes(15);
            Mail::to($email)->send(new \App\Mail\PasswordResetEmail($code, $expiresAt));
            Log::info("Password reset email sent to {$email}");
        } catch (\Exception $e) {
            Log::error("Failed to send password reset email to {$email}: " . $e->getMessage());
            // Still log the code for backup
            Log::info("Password reset code for {$email}: {$code}");
        }
    }
}
