<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProjectPlan;
use App\Models\PlanMeasurement;
use App\Models\Job;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class PlanController extends Controller
{
    /**
     * Get all plans (optionally filtered by job)
     */
    public function index(Request $request)
    {
        $query = ProjectPlan::with(['job', 'uploader:id,fullname,email']);

        // Filter by job if provided
        if ($request->has('job_id')) {
            $query->where('job_id', $request->job_id);
        }

        // Filter by user if not admin (skip if no user - dev mode)
        if ($request->user() && $request->user()->role !== 'admin') {
            // Get jobs assigned to this user
            $jobIds = $request->user()->assignedJobs()->pluck('jobs.id');
            $query->whereIn('job_id', $jobIds);
        }

        $plans = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $plans->map(function ($plan) {
                return [
                    'id' => $plan->id,
                    'job_id' => $plan->job_id,
                    'job_title' => $plan->job->job_name ?? 'N/A',
                    'file_name' => $plan->file_name,
                    'file_type' => $plan->file_type,
                    'file_size' => $plan->file_size,
                    'total_pages' => $plan->total_pages,
                    'uploaded_by' => $plan->uploader->fullname ?? 'Unknown',
                    'uploaded_at' => $plan->created_at->toISOString(),
                    'measurements_count' => $plan->measurements()->count(),
                    'thumbnail_url' => $plan->thumbnail_url ? $this->getThumbnailUrl($plan) : null,
                ];
            }),
        ]);
    }

    /**
     * Upload a new plan (Admin only)
     */
    public function store(Request $request)
    {
        // Check if user is admin (skip check in dev mode if no user)
        if ($request->user() && $request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Only administrators can upload plans'
            ], 403);
        }

        // Log request data for debugging
        \Log::info('Plan upload request', [
            'job_id' => $request->job_id,
            'has_file' => $request->hasFile('file'),
            'all_data' => $request->except('file')
        ]);

        $validator = Validator::make($request->all(), [
            'job_id' => 'required|numeric|exists:project_jobs,id',
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:51200', // 50MB max
        ]);

        if ($validator->fails()) {
            \Log::error('Plan upload validation failed', [
                'errors' => $validator->errors()->toArray(),
                'job_id' => $request->job_id,
                'job_id_type' => gettype($request->job_id)
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $file = $request->file('file');
            $jobId = $request->job_id;
            
            // Generate unique filename
            $extension = $file->getClientOriginalExtension();
            $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            $fileName = Str::slug($originalName) . '_' . time() . '.' . $extension;
            
            // S3 path: plans/job_{id}/filename
            $s3Key = "plans/job_{$jobId}/{$fileName}";
            
            // Upload to storage (S3 for production, public local storage for development)
            $disk = config('filesystems.default');
            
            if ($disk === 's3') {
                // S3 storage
                $path = Storage::disk('s3')->putFileAs(
                    "plans/job_{$jobId}",
                    $file,
                    $fileName,
                    'public'
                );
            } else {
                // Local public storage for development
                $path = Storage::disk('public')->putFileAs(
                    "plans/job_{$jobId}",
                    $file,
                    $fileName
                );
            }

            // Determine total pages (1 for images, will need to extract for PDFs)
            $totalPages = 1;
            $fileType = $file->getMimeType();
            
            if ($fileType === 'application/pdf') {
                // For PDFs, we'll extract page count on frontend using PDF.js
                // or you can use a PHP library like TCPDF or pdfinfo
                $totalPages = 1; // Default, will be updated from frontend if needed
            }

            // Create plan record
            $plan = ProjectPlan::create([
                'job_id' => $jobId,
                'uploaded_by' => $request->user() ? $request->user()->id : 1, // Default to user ID 1 in dev mode
                'file_name' => $file->getClientOriginalName(),
                'file_path' => $path,
                'file_type' => $fileType,
                'total_pages' => $totalPages,
                'file_size' => $file->getSize(),
                's3_key' => $s3Key,
            ]);

            // Generate thumbnail for PDFs
            $thumbnailUrl = null;
            if ($fileType === 'application/pdf') {
                $thumbnailUrl = $this->generatePdfThumbnail($path, $plan);
            }

            // Get signed URL for immediate access
            $signedUrl = $plan->getSignedUrl();

            return response()->json([
                'success' => true,
                'message' => 'Plan uploaded successfully',
                'data' => [
                    'id' => $plan->id,
                    'job_id' => $plan->job_id,
                    'file_name' => $plan->file_name,
                    'file_type' => $plan->file_type,
                    'total_pages' => $plan->total_pages,
                    'file_url' => $signedUrl,
                    'uploaded_at' => $plan->created_at->toISOString(),
                    'thumbnail_url' => $thumbnailUrl,
                ]
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Plan upload failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload plan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific plan with its file URL
     */
    public function show(Request $request, $id)
    {
        $plan = ProjectPlan::with(['job', 'uploader:id,fullname,email'])->find($id);

        if (!$plan) {
            return response()->json([
                'success' => false,
                'message' => 'Plan not found'
            ], 404);
        }

        // Check permission (admin or assigned to job) - skip in dev mode if no user
        if ($request->user() && $request->user()->role !== 'admin') {
            $jobIds = $request->user()->assignedJobs()->pluck('jobs.id');
            if (!$jobIds->contains($plan->job_id)) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have access to this plan'
                ], 403);
            }
        }

        // Get signed URL
        $signedUrl = $plan->getSignedUrl();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $plan->id,
                'job_id' => $plan->job_id,
                'job_title' => $plan->job->job_name ?? 'N/A',
                'file_name' => $plan->file_name,
                'file_type' => $plan->file_type,
                'file_size' => $plan->file_size,
                'total_pages' => $plan->total_pages,
                'file_url' => $signedUrl,
                'uploaded_by' => $plan->uploader->fullname ?? 'Unknown',
                'uploaded_at' => $plan->created_at->toISOString(),
                'measurements_count' => $plan->measurements()->count(),
            ]
        ]);
    }

    /**
     * Serve plan file with proper CORS headers
     */
    public function serveFile(Request $request, $id)
    {
        $plan = ProjectPlan::find($id);

        if (!$plan) {
            return response()->json([
                'success' => false,
                'message' => 'Plan not found'
            ], 404);
        }

        $disk = config('filesystems.default');
        
        try {
            if ($disk === 's3') {
                // For S3, redirect to signed URL
                return redirect($plan->getSignedUrl());
            } else {
                // For local storage, serve the file directly with CORS headers
                $filePath = storage_path('app/public/' . $plan->file_path);
                
                if (!file_exists($filePath)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'File not found'
                    ], 404);
                }

                return response()->file($filePath, [
                    'Content-Type' => $plan->file_type,
                    'Access-Control-Allow-Origin' => '*',
                    'Access-Control-Allow-Methods' => 'GET, OPTIONS',
                    'Access-Control-Allow-Headers' => 'Content-Type, Authorization',
                ]);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error serving file: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a plan (Admin only)
     */
    public function destroy(Request $request, $id)
    {
        // Check if user is admin (skip check in dev mode if no user)
        if ($request->user() && $request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Only administrators can delete plans'
            ], 403);
        }

        $plan = ProjectPlan::find($id);

        if (!$plan) {
            return response()->json([
                'success' => false,
                'message' => 'Plan not found'
            ], 404);
        }

        try {
            $plan->deleteWithFile();

            return response()->json([
                'success' => true,
                'message' => 'Plan deleted successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Plan deletion failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete plan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update plan total pages (useful after PDF is analyzed on frontend)
     */
    public function updatePages(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'total_pages' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $plan = ProjectPlan::find($id);

        if (!$plan) {
            return response()->json([
                'success' => false,
                'message' => 'Plan not found'
            ], 404);
        }

        $plan->update(['total_pages' => $request->total_pages]);

        return response()->json([
            'success' => true,
            'message' => 'Total pages updated',
            'data' => ['total_pages' => $plan->total_pages]
        ]);
    }

    /**
     * Save measurements for a plan
     */
    public function saveMeasurements(Request $request, $planId)
    {
        $plan = ProjectPlan::find($planId);

        if (!$plan) {
            return response()->json([
                'success' => false,
                'message' => 'Plan not found'
            ], 404);
        }

        // Check permission (skip in dev mode if no user)
        if ($request->user() && $request->user()->role !== 'admin') {
            $jobIds = $request->user()->assignedJobs()->pluck('jobs.id');
            if (!$jobIds->contains($plan->job_id)) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have access to this plan'
                ], 403);
            }
        }

        $validator = Validator::make($request->all(), [
            'measurements' => 'required|array',
            'measurements.*.page_number' => 'required|integer|min:1',
            'measurements.*.layer_name' => 'required|string|max:255',
            'measurements.*.type' => 'required|in:line,poly,polyline,area,count',
            'measurements.*.color' => 'required|string|max:7',
            'measurements.*.coordinates' => 'required|array',
            'measurements.*.value' => 'nullable|numeric',
            'measurements.*.unit' => 'nullable|string|max:50',
            'measurements.*.scale_info' => 'nullable|array',
            'measurements.*.notes' => 'nullable|string',
            'measurements.*.discipline_id' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $savedMeasurements = [];

            foreach ($request->measurements as $measurementData) {
                $measurement = PlanMeasurement::create([
                    'plan_id' => $planId,
                    'created_by' => $request->user() ? $request->user()->id : 1, // Default to user ID 1 in dev mode
                    'page_number' => $measurementData['page_number'],
                    'layer_name' => $measurementData['layer_name'],
                    'type' => $measurementData['type'],
                    'color' => $measurementData['color'],
                    'coordinates' => $measurementData['coordinates'],
                    'value' => $measurementData['value'] ?? null,
                    'unit' => $measurementData['unit'] ?? null,
                    'scale_info' => $measurementData['scale_info'] ?? null,
                    'notes' => $measurementData['notes'] ?? null,
                    'discipline_id' => $measurementData['discipline_id'] ?? null,
                ]);

                $savedMeasurements[] = $measurement;
            }

            return response()->json([
                'success' => true,
                'message' => 'Measurements saved successfully',
                'data' => [
                    'count' => count($savedMeasurements),
                    'measurements' => $savedMeasurements,
                ]
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Measurements save failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to save measurements: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get measurements for a plan (optionally filtered by page)
     */
    public function getMeasurements(Request $request, $planId)
    {
        $plan = ProjectPlan::find($planId);

        if (!$plan) {
            return response()->json([
                'success' => false,
                'message' => 'Plan not found'
            ], 404);
        }

        // Check permission - skip in dev mode if no user
        if ($request->user() && $request->user()->role !== 'admin') {
            $jobIds = $request->user()->assignedJobs()->pluck('jobs.id');
            if (!$jobIds->contains($plan->job_id)) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have access to this plan'
                ], 403);
            }
        }

        $query = PlanMeasurement::where('plan_id', $planId)
            ->with('creator:id,fullname');

        // Filter by page if provided
        if ($request->has('page_number')) {
            $query->where('page_number', $request->page_number);
        }

        $measurements = $query->orderBy('created_at', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $measurements->map(function ($m) {
                return [
                    'id' => $m->id,
                    'page_number' => $m->page_number,
                    'layer_name' => $m->layer_name,
                    'type' => $m->type,
                    'color' => $m->color,
                    'coordinates' => $m->coordinates,
                    'value' => $m->value,
                    'unit' => $m->unit,
                    'scale_info' => $m->scale_info,
                    'notes' => $m->notes,
                    'created_by' => $m->creator->fullname ?? 'Unknown',
                    'created_at' => $m->created_at->toISOString(),
                ];
            }),
        ]);
    }

    /**
     * Delete a measurement (only creator can delete, but cannot edit)
     */
    public function deleteMeasurement(Request $request, $measurementId)
    {
        $measurement = PlanMeasurement::find($measurementId);

        if (!$measurement) {
            return response()->json([
                'success' => false,
                'message' => 'Measurement not found'
            ], 404);
        }

        // Only creator or admin can delete (skip check in dev mode if no user)
        if ($request->user() && $request->user()->role !== 'admin' && $measurement->created_by !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only delete your own measurements'
            ], 403);
        }

        $measurement->delete();

        return response()->json([
            'success' => true,
            'message' => 'Measurement deleted successfully'
        ]);
    }

    /**
     * Regenerate thumbnail for a plan (Admin only)
     */
    public function regenerateThumbnail(Request $request, $id)
    {
        // Check if user is admin
        if ($request->user() && $request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Only administrators can regenerate thumbnails'
            ], 403);
        }

        $plan = ProjectPlan::find($id);

        if (!$plan) {
            return response()->json([
                'success' => false,
                'message' => 'Plan not found'
            ], 404);
        }

        if ($plan->file_type !== 'application/pdf') {
            return response()->json([
                'success' => false,
                'message' => 'Thumbnails can only be generated for PDF files'
            ], 400);
        }

        try {
            $thumbnailUrl = $this->generatePdfThumbnail($plan->file_path, $plan);

            if (!$thumbnailUrl) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to generate thumbnail. Imagick extension may not be available.'
                ], 500);
            }

            return response()->json([
                'success' => true,
                'message' => 'Thumbnail generated successfully',
                'data' => [
                    'thumbnail_url' => $this->getThumbnailUrl($plan)
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Thumbnail regeneration failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to regenerate thumbnail: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate thumbnail for PDF (first page)
     */
    private function generatePdfThumbnail($filePath, $plan)
    {
        try {
            // Check if Imagick is available
            if (!extension_loaded('imagick')) {
                \Log::warning('Imagick extension not available. Skipping thumbnail generation.');
                return null;
            }

            $imagick = new \Imagick();
            
            // For S3, download file temporarily
            $disk = config('filesystems.default');
            if ($disk === 's3') {
                $tempFile = tempnam(sys_get_temp_dir(), 'pdf_');
                file_put_contents($tempFile, Storage::disk('s3')->get($filePath));
                $sourcePath = $tempFile;
            } else {
                $sourcePath = storage_path('app/public/' . $filePath);
            }

            // Read first page of PDF
            $imagick->readImage($sourcePath . '[0]');
            $imagick->setImageFormat('jpg');
            $imagick->setImageCompressionQuality(85);
            
            // Resize to thumbnail (maintain aspect ratio)
            $imagick->thumbnailImage(400, 400, true);
            
            // Generate thumbnail filename
            $thumbFileName = 'thumb_' . pathinfo($plan->file_name, PATHINFO_FILENAME) . '.jpg';
            $thumbS3Key = "plans/job_{$plan->job_id}/thumbnails/{$thumbFileName}";
            
            // Save thumbnail
            if ($disk === 's3') {
                // Upload to S3
                Storage::disk('s3')->put($thumbS3Key, $imagick->getImageBlob(), 'public');
                $thumbUrl = Storage::disk('s3')->url($thumbS3Key);
            } else {
                // Save locally
                $thumbPath = "plans/job_{$plan->job_id}/thumbnails/{$thumbFileName}";
                Storage::disk('public')->put($thumbPath, $imagick->getImageBlob());
                $thumbUrl = Storage::disk('public')->url($thumbPath);
            }
            
            // Clean up
            $imagick->clear();
            $imagick->destroy();
            
            if ($disk === 's3' && isset($tempFile)) {
                unlink($tempFile);
            }
            
            // Update plan with thumbnail info
            $plan->update([
                'thumbnail_url' => $thumbUrl,
                'thumbnail_s3_key' => $thumbS3Key
            ]);
            
            return $thumbUrl;
            
        } catch (\Exception $e) {
            \Log::error('Thumbnail generation failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get thumbnail URL with proper signing for S3
     */
    private function getThumbnailUrl($plan)
    {
        if (!$plan->thumbnail_url) {
            return null;
        }

        $disk = config('filesystems.default');
        
        if ($disk === 's3' && $plan->thumbnail_s3_key) {
            // Return signed URL for S3
            return Storage::disk('s3')->temporaryUrl(
                $plan->thumbnail_s3_key,
                now()->addMinutes(60)
            );
        }
        
        // Return direct URL for local storage
        return $plan->thumbnail_url;
    }
}

