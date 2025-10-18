<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Job;
use App\Models\JobTimeLog;
use App\Models\JobUpload;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Carbon\Carbon;

class JobController extends Controller
{
    /**
     * Display a listing of jobs.
     */
    public function index(Request $request)
    {
        // Optimized: Only load employee count and basic info for list view
        $query = Job::withCount('employees')
            ->with(['employees:id,fullname', 'creator:id,fullname']);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by assigned employee (for employee dashboard)
        if ($request->has('employee_id')) {
            $query->whereHas('employees', function($q) use ($request) {
                $q->where('users.id', $request->employee_id);
            });
        }

        // Search by job name or job ID
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('job_name', 'like', '%' . $search . '%')
                  ->orWhere('job_id', 'like', '%' . $search . '%')
                  ->orWhere('client_name', 'like', '%' . $search . '%');
            });
        }

        // Pagination
        $perPage = $request->get('per_page', 15);
        $jobs = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $jobs
        ], 200);
    }

    /**
     * Store a newly created job.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'job_name' => 'required|string|max:255',
            'job_description' => 'nullable|string',
            'client_name' => 'nullable|string|max:255',
            'site_contact' => 'nullable|string|max:255',
            'job_address' => 'nullable|string',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'start_date' => 'nullable|date',
            'deadline' => 'nullable|date',
            'status' => 'in:pending,in_progress,completed,on_hold',
            'employee_ids' => 'nullable|array',
            'employee_ids.*' => 'exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors()
            ], 422);
        }

        $job = Job::create([
            'job_name' => $request->job_name,
            'job_description' => $request->job_description,
            'client_name' => $request->client_name,
            'site_contact' => $request->site_contact,
            'job_address' => $request->job_address,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'start_date' => $request->start_date,
            'deadline' => $request->deadline,
            'status' => $request->get('status', 'pending'),
            'created_by' => $request->user()->id,
        ]);

        // Assign employees if provided
        if ($request->has('employee_ids') && is_array($request->employee_ids)) {
            $job->employees()->attach($request->employee_ids);

            // TODO: Send notifications to assigned employees
        }

        $job->load(['employees', 'creator']);

        return response()->json([
            'success' => true,
            'message' => 'Job created successfully',
            'data' => $job
        ], 201);
    }

    /**
     * Display the specified job.
     */
    public function show($id)
    {
        $job = Job::with(['employees.employeeRole', 'creator', 'timeLogs.user', 'uploads.user'])
            ->find($id);

        if (!$job) {
            return response()->json([
                'success' => false,
                'message' => 'Job not found'
            ], 404);
        }

        // Add computed attributes
        $jobData = $job->toArray();
        $jobData['total_time'] = $job->total_time;
        $jobData['is_overdue'] = $job->isOverdue();
        $jobData['time_per_employee'] = $job->getTimePerEmployee();

        return response()->json([
            'success' => true,
            'data' => $jobData
        ], 200);
    }

    /**
     * Update the specified job.
     */
    public function update(Request $request, $id)
    {
        $job = Job::find($id);

        if (!$job) {
            return response()->json([
                'success' => false,
                'message' => 'Job not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'job_name' => 'required|string|max:255',
            'job_description' => 'nullable|string',
            'client_name' => 'nullable|string|max:255',
            'site_contact' => 'nullable|string|max:255',
            'job_address' => 'nullable|string',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'start_date' => 'nullable|date',
            'deadline' => 'nullable|date',
            'status' => 'in:pending,in_progress,completed,on_hold',
            'employee_ids' => 'nullable|array',
            'employee_ids.*' => 'exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors()
            ], 422);
        }

        $job->update($request->except(['employee_ids']));

        // Update assigned employees
        if ($request->has('employee_ids')) {
            $job->employees()->sync($request->employee_ids);
        }

        $job->load(['employees', 'creator']);

        return response()->json([
            'success' => true,
            'message' => 'Job updated successfully',
            'data' => $job
        ], 200);
    }

    /**
     * Remove the specified job.
     */
    public function destroy($id)
    {
        $job = Job::find($id);

        if (!$job) {
            return response()->json([
                'success' => false,
                'message' => 'Job not found'
            ], 404);
        }

        // Delete associated files from storage
        foreach ($job->uploads as $upload) {
            Storage::delete($upload->file_path);
        }

        $job->delete();

        return response()->json([
            'success' => true,
            'message' => 'Job deleted successfully'
        ], 200);
    }

    /**
     * Bulk upload jobs via CSV.
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

        // Remove header row and trim whitespace
        $header = array_map('trim', array_shift($csvData));
        $headerCount = count($header);

        $imported = 0;
        $failed = 0;
        $errors = [];

        foreach ($csvData as $index => $row) {
            // Skip empty rows
            if (empty(array_filter($row))) {
                continue;
            }

            try {
                $rowNumber = $index + 2; // +2 because index starts at 0 and we removed header

                // Check if row has same number of columns as header
                if (count($row) !== $headerCount) {
                    $errors[] = "Row {$rowNumber}: Expected {$headerCount} columns, got " . count($row) . " columns";
                    $failed++;
                    continue;
                }

                // Combine header with row data
                $rowData = array_combine($header, array_map('trim', $row));

                // Validate required field
                if (empty($rowData['job_name'])) {
                    $errors[] = "Row {$rowNumber}: job_name is required";
                    $failed++;
                    continue;
                }

                // Create job
                $job = Job::create([
                    'job_name' => $rowData['job_name'],
                    'job_description' => $rowData['job_description'] ?? null,
                    'client_name' => $rowData['client_name'] ?? null,
                    'site_contact' => $rowData['site_contact'] ?? null,
                    'job_address' => $rowData['job_address'] ?? null,
                    'latitude' => !empty($rowData['latitude']) ? $rowData['latitude'] : null,
                    'longitude' => !empty($rowData['longitude']) ? $rowData['longitude'] : null,
                    'start_date' => !empty($rowData['start_date']) ? $rowData['start_date'] : null,
                    'deadline' => !empty($rowData['deadline']) ? $rowData['deadline'] : null,
                    'status' => !empty($rowData['status']) ? $rowData['status'] : 'pending',
                    'created_by' => $request->user()->id,
                ]);

                // Assign employees if employee_ids are provided
                if (!empty($rowData['employee_ids'])) {
                    $employeeIds = array_map('trim', explode(',', $rowData['employee_ids']));
                    $employeeIds = array_filter($employeeIds, 'is_numeric');
                    if (!empty($employeeIds)) {
                        $job->employees()->attach($employeeIds);
                    }
                }

                $imported++;
            } catch (\Exception $e) {
                $errors[] = "Row {$rowNumber}: " . $e->getMessage();
                $failed++;
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Bulk upload completed. Imported: {$imported}, Failed: {$failed}",
            'imported' => $imported,
            'failed' => $failed,
            'errors' => $errors
        ], 200);
    }

    /**
     * Update job status (for employees).
     */
    public function updateStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,in_progress,completed,on_hold',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors()
            ], 422);
        }

        $job = Job::find($id);

        if (!$job) {
            return response()->json([
                'success' => false,
                'message' => 'Job not found'
            ], 404);
        }

        $job->update(['status' => $request->status]);

        return response()->json([
            'success' => true,
            'message' => 'Job status updated successfully',
            'data' => $job
        ], 200);
    }

    /**
     * Log time action (start, pause, resume, stop).
     */
    public function logTime(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'action' => 'required|in:start,pause,resume,stop',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors()
            ], 422);
        }

        $job = Job::find($id);

        if (!$job) {
            return response()->json([
                'success' => false,
                'message' => 'Job not found'
            ], 404);
        }

        $timeLog = JobTimeLog::create([
            'job_id' => $id,
            'user_id' => $request->user()->id,
            'action' => $request->action,
            'action_time' => Carbon::now(),
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'notes' => $request->notes,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Time logged successfully',
            'data' => $timeLog
        ], 201);
    }

    /**
     * Upload file to job (image, PDF, audio).
     */
    public function uploadFile(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:10240', // 10MB max
            'file_type' => 'required|in:image,pdf,audio',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors()
            ], 422);
        }

        $job = Job::find($id);

        if (!$job) {
            return response()->json([
                'success' => false,
                'message' => 'Job not found'
            ], 404);
        }

        $file = $request->file('file');
        $fileName = time() . '_' . $file->getClientOriginalName();
        $filePath = $file->storeAs('job_uploads', $fileName, 'public');

        $upload = JobUpload::create([
            'job_id' => $id,
            'user_id' => $request->user()->id,
            'file_type' => $request->file_type,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $filePath,
            'file_size' => $file->getSize(),
            'description' => $request->description,
        ]);

        // TODO: If audio file, convert to text using speech-to-text API

        return response()->json([
            'success' => true,
            'message' => 'File uploaded successfully',
            'data' => $upload
        ], 201);
    }

    /**
     * Download uploaded file.
     */
    public function downloadFile($uploadId)
    {
        $upload = JobUpload::with('job')->find($uploadId);

        if (!$upload) {
            return response()->json([
                'success' => false,
                'message' => 'File not found'
            ], 404);
        }

        $filePath = storage_path('app/public/' . $upload->file_path);

        if (!file_exists($filePath)) {
            return response()->json([
                'success' => false,
                'message' => 'File not found on server'
            ], 404);
        }

        return response()->download($filePath, $upload->file_name);
    }

    /**
     * Get assigned jobs for the authenticated employee.
     */
    public function myJobs(Request $request)
    {
        $user = $request->user();

        $jobs = $user->jobs()
            ->with(['creator', 'timeLogs' => function($query) use ($user) {
                $query->where('user_id', $user->id)
                      ->orderBy('action_time', 'desc')
                      ->limit(1);
            }])
            ->get();

        return response()->json([
            'success' => true,
            'data' => $jobs
        ], 200);
    }

    /**
     * Get current location of employees working on a job.
     */
    public function getEmployeeLocations($id)
    {
        $job = Job::find($id);

        if (!$job) {
            return response()->json([
                'success' => false,
                'message' => 'Job not found'
            ], 404);
        }

        // Get latest location for each employee currently working on this job
        $locations = JobTimeLog::where('job_id', $id)
            ->whereIn('action', ['start', 'resume'])
            ->with('user:id,fullname,email')
            ->orderBy('action_time', 'desc')
            ->get()
            ->groupBy('user_id')
            ->map(function($logs) {
                $latestLog = $logs->first();

                // Check if there's a pause/stop action after this start/resume
                $hasStoppedAfter = JobTimeLog::where('job_id', $latestLog->job_id)
                    ->where('user_id', $latestLog->user_id)
                    ->whereIn('action', ['pause', 'stop'])
                    ->where('action_time', '>', $latestLog->action_time)
                    ->exists();

                return [
                    'user' => $latestLog->user,
                    'latitude' => $latestLog->latitude,
                    'longitude' => $latestLog->longitude,
                    'last_update' => $latestLog->action_time,
                    'is_active' => !$hasStoppedAfter
                ];
            })
            ->filter(function($location) {
                return $location['is_active'] && $location['latitude'] && $location['longitude'];
            })
            ->values();

        return response()->json([
            'success' => true,
            'data' => $locations
        ], 200);
    }
}
