<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class EmployeeController extends Controller
{
    /**
     * Display a listing of employees.
     */
    public function index(Request $request)
    {
        $query = User::where('role', 'employee')
            ->with('employeeRole');

        // Filter by approval status
        if ($request->has('approval_status')) {
            $query->where('approval_status', $request->approval_status);
        }

        // Filter by availability status
        if ($request->has('availability_status')) {
            $query->where('availability_status', $request->availability_status);
        }

        // Filter by role (position)
        if ($request->has('role_id')) {
            $query->where('role_id', $request->role_id);
        }

        // Search by name or email
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('fullname', 'like', '%' . $search . '%')
                  ->orWhere('email', 'like', '%' . $search . '%')
                  ->orWhere('phone', 'like', '%' . $search . '%');
            });
        }

        // Pagination
        $perPage = $request->get('per_page', 15);
        $employees = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $employees
        ], 200);
    }

    /**
     * Store a newly created employee (Admin creates).
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'fullname' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'role_id' => 'nullable|exists:roles,id',
            'availability_status' => 'in:available,on_job,on_leave,unavailable',
            'approval_status' => 'in:pending,approved,rejected',
            'password' => 'required|string|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors()
            ], 422);
        }

        $employee = User::create([
            'name' => $request->fullname,
            'fullname' => $request->fullname,
            'email' => $request->email,
            'phone' => $request->phone,
            'address' => $request->address,
            'role' => 'employee',
            'role_id' => $request->role_id,
            'availability_status' => $request->get('availability_status', 'available'),
            'approval_status' => $request->get('approval_status', 'approved'), // Admin-created employees are auto-approved
            'password' => Hash::make($request->password),
            'is_verified' => true, // Admin-created employees are auto-verified
        ]);

        $employee->load('employeeRole');

        return response()->json([
            'success' => true,
            'message' => 'Employee created successfully',
            'data' => $employee
        ], 201);
    }

    /**
     * Display the specified employee.
     */
    public function show($id)
    {
        $employee = User::where('role', 'employee')
            ->with('employeeRole')
            ->find($id);

        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => 'Employee not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $employee
        ], 200);
    }

    /**
     * Update the specified employee.
     */
    public function update(Request $request, $id)
    {
        $employee = User::where('role', 'employee')->find($id);

        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => 'Employee not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'fullname' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $id,
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'role_id' => 'nullable|exists:roles,id',
            'availability_status' => 'in:available,on_job,on_leave,unavailable',
            'password' => 'nullable|string|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors()
            ], 422);
        }

        $updateData = [
            'name' => $request->fullname,
            'fullname' => $request->fullname,
            'email' => $request->email,
            'phone' => $request->phone,
            'address' => $request->address,
            'role_id' => $request->role_id,
            'availability_status' => $request->availability_status,
        ];

        // Only update password if provided
        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        $employee->update($updateData);
        $employee->load('employeeRole');

        return response()->json([
            'success' => true,
            'message' => 'Employee updated successfully',
            'data' => $employee
        ], 200);
    }

    /**
     * Remove the specified employee.
     */
    public function destroy($id)
    {
        $employee = User::where('role', 'employee')->find($id);

        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => 'Employee not found'
            ], 404);
        }

        $employee->delete();

        return response()->json([
            'success' => true,
            'message' => 'Employee deleted successfully'
        ], 200);
    }

    /**
     * Approve or reject an employee.
     */
    public function updateApprovalStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'approval_status' => 'required|in:approved,rejected',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors()
            ], 422);
        }

        $employee = User::where('role', 'employee')->find($id);

        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => 'Employee not found'
            ], 404);
        }

        $employee->update([
            'approval_status' => $request->approval_status
        ]);

        // TODO: Send notification to employee (email + in-app)

        return response()->json([
            'success' => true,
            'message' => 'Employee ' . $request->approval_status . ' successfully',
            'data' => $employee
        ], 200);
    }

    /**
     * Bulk upload employees via CSV.
     */
    public function bulkUpload(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:csv,txt|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors()
            ], 422);
        }

        $file = $request->file('file');
        $path = $file->getRealPath();
        $csvData = array_map('str_getcsv', file($path));

        // Remove header row
        $header = array_shift($csvData);

        $imported = 0;
        $failed = 0;
        $errors = [];

        foreach ($csvData as $index => $row) {
            try {
                // Expected CSV format: fullname, email, phone, address, role_name
                $rowData = array_combine($header, $row);

                // Find role by name if provided
                $roleId = null;
                if (!empty($rowData['role_name'])) {
                    $role = Role::where('name', $rowData['role_name'])->first();
                    if ($role) {
                        $roleId = $role->id;
                    }
                }

                // Check if email already exists
                if (User::where('email', $rowData['email'])->exists()) {
                    $errors[] = "Row " . ($index + 2) . ": Email {$rowData['email']} already exists";
                    $failed++;
                    continue;
                }

                // Generate random password
                $password = Str::random(12);

                User::create([
                    'name' => $rowData['fullname'],
                    'fullname' => $rowData['fullname'],
                    'email' => $rowData['email'],
                    'phone' => $rowData['phone'] ?? null,
                    'address' => $rowData['address'] ?? null,
                    'role' => 'employee',
                    'role_id' => $roleId,
                    'availability_status' => 'available',
                    'approval_status' => 'approved', // Bulk uploaded employees are auto-approved
                    'password' => Hash::make($password),
                    'is_verified' => true,
                ]);

                // TODO: Send welcome email with password to employee

                $imported++;
            } catch (\Exception $e) {
                $errors[] = "Row " . ($index + 2) . ": " . $e->getMessage();
                $failed++;
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Bulk upload completed. Imported: {$imported}, Failed: {$failed}",
            'data' => [
                'imported' => $imported,
                'failed' => $failed,
                'errors' => $errors
            ]
        ], 200);
    }
}
