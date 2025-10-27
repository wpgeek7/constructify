<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AIAnalysis;
use App\Models\JobUpload;
use App\Services\MoondreamService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class AIAnalysisController extends Controller
{
    protected $moondreamService;

    public function __construct(MoondreamService $moondreamService)
    {
        $this->moondreamService = $moondreamService;
    }

    /**
     * Analyze a photo with comprehensive AI analysis
     */
    public function analyzePhoto(Request $request, $id)
    {
        try {
            $upload = JobUpload::findOrFail($id);

            // Check if file exists
            $filePath = storage_path('app/public/' . $upload->file_path);
            if (!file_exists($filePath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Photo file not found'
                ], 404);
            }

            // Read image and convert to base64
            $imageData = base64_encode(file_get_contents($filePath));
            $imageDataUrl = 'data:image/jpeg;base64,' . $imageData;

            // Perform comprehensive analysis
            $analysisResult = $this->moondreamService->analyzeImage($imageDataUrl);

            if (!$analysisResult['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'AI analysis failed: ' . ($analysisResult['error'] ?? 'Unknown error')
                ], 500);
            }

            // Create or update AI analysis record
            $analysis = AIAnalysis::updateOrCreate(
                ['upload_id' => $upload->id],
                [
                    'job_id' => $upload->job_id,
                    'analyzed_by' => auth()->id(),
                    'caption' => $analysisResult['caption'],
                    'detailed_description' => $analysisResult['detailed_description'],
                    'objects_detected' => $analysisResult['objects_detected'],
                    'people_count' => $analysisResult['people_count'],
                    'people_details' => $analysisResult['people_details'],
                    'scene_type' => $analysisResult['scene_type'],
                    'time_of_day' => $analysisResult['time_of_day'],
                    'weather_condition' => $analysisResult['weather_condition'],
                    'lighting_quality' => $analysisResult['lighting_quality'],
                    'scene_mood' => $analysisResult['scene_mood'],
                    'extracted_text' => $analysisResult['extracted_text'],
                    'activities_detected' => $analysisResult['activities_detected'],
                    'primary_activity' => $analysisResult['primary_activity'],
                    'dominant_colors' => $analysisResult['dominant_colors'],
                    'color_palette' => $analysisResult['color_palette'],
                    'visual_aesthetics' => $analysisResult['visual_aesthetics'],
                    'image_quality' => $analysisResult['image_quality'],
                    'is_blurry' => $analysisResult['is_blurry'],
                    'is_overexposed' => $analysisResult['is_overexposed'],
                    'is_underexposed' => $analysisResult['is_underexposed'],
                    'composition_notes' => $analysisResult['composition_notes'],
                    'safety_compliance' => $analysisResult['safety_compliance'],
                    'compliance_score' => $analysisResult['compliance_score'],
                    'has_violations' => $analysisResult['has_violations'],
                    'violations_count' => $analysisResult['violations_count'],
                    'processing_time_ms' => $analysisResult['processing_time_ms'],
                    'ai_model_version' => $analysisResult['ai_model_version'],
                    'analyzed_at' => $analysisResult['analyzed_at'],
                ]
            );

            // Update upload record with AI description
            $upload->update([
                'description' => $analysisResult['caption'], // Save AI description
                'ai_analyzed' => true,
                'ai_analysis_id' => $analysis->id,
                'ai_analyzed_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Comprehensive AI analysis completed successfully',
                'data' => $this->formatAnalysisResponse($analysis)
            ]);

        } catch (\Exception $e) {
            Log::error('AI Analysis error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Analysis failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get analysis results for an upload
     */
    public function getAnalysis($id)
    {
        try {
            $upload = JobUpload::with('aiAnalysis')->findOrFail($id);

            if (!$upload->ai_analyzed || !$upload->aiAnalysis) {
                return response()->json([
                    'success' => false,
                    'message' => 'No analysis found for this upload'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $this->formatAnalysisResponse($upload->aiAnalysis)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve analysis: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Re-analyze a photo
     */
    public function reanalyzePhoto(Request $request, $id)
    {
        return $this->analyzePhoto($request, $id);
    }

    /**
     * Get AI statistics for a job
     */
    public function getJobAIStats($jobId)
    {
        try {
            $analyses = AIAnalysis::where('job_id', $jobId)->get();

            $stats = [
                'total_analyses' => $analyses->count(),
                'average_compliance' => $analyses->avg('compliance_score'),
                'total_violations' => $analyses->sum('violations_count'),
                'quality_breakdown' => [
                    'excellent' => $analyses->where('image_quality', 'excellent')->count(),
                    'good' => $analyses->where('image_quality', 'good')->count(),
                    'fair' => $analyses->where('image_quality', 'fair')->count(),
                    'poor' => $analyses->where('image_quality', 'poor')->count(),
                ],
                'scene_types' => $analyses->pluck('scene_type')->filter()->unique()->values(),
                'average_people_count' => $analyses->avg('people_count'),
                'images_with_text' => $analyses->whereNotNull('extracted_text')->count(),
                'blurry_images' => $analyses->where('is_blurry', true)->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get stats: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Format analysis response
     */
    protected function formatAnalysisResponse(AIAnalysis $analysis): array
    {
        return [
            'id' => $analysis->id,
            'upload_id' => $analysis->upload_id,
            'job_id' => $analysis->job_id,

            // Basic Description
            'caption' => $analysis->caption,
            'detailed_description' => $analysis->detailed_description,

            // Objects & People
            'objects_detected' => $analysis->objects_detected ?? [],
            'people_count' => $analysis->people_count,
            'people_details' => $analysis->people_details ?? [],

            // Scene Understanding
            'scene_type' => $analysis->scene_type,
            'time_of_day' => $analysis->time_of_day,
            'weather_condition' => $analysis->weather_condition,
            'lighting_quality' => $analysis->lighting_quality,
            'scene_mood' => $analysis->scene_mood,

            // Text & Activities
            'extracted_text' => $analysis->extracted_text,
            'has_text' => !empty($analysis->extracted_text),
            'activities_detected' => $analysis->activities_detected ?? [],
            'primary_activity' => $analysis->primary_activity,

            // Visual Analysis
            'dominant_colors' => $analysis->dominant_colors ?? [],
            'color_palette' => $analysis->color_palette,
            'visual_aesthetics' => $analysis->visual_aesthetics,

            // Quality Assessment
            'image_quality' => $analysis->image_quality,
            'is_blurry' => $analysis->is_blurry,
            'is_overexposed' => $analysis->is_overexposed,
            'is_underexposed' => $analysis->is_underexposed,
            'composition_notes' => $analysis->composition_notes,

            // Safety (Construction)
            'safety_compliance' => $analysis->safety_compliance ?? [],
            'compliance_score' => $analysis->compliance_score,
            'compliance_level' => $analysis->getComplianceLevel(),
            'has_violations' => $analysis->has_violations,
            'violations_count' => $analysis->violations_count,

            // Metadata
            'processing_time_ms' => $analysis->processing_time_ms,
            'ai_model_version' => $analysis->ai_model_version,
            'analyzed_at' => $analysis->analyzed_at?->format('Y-m-d H:i:s'),
            'analyzed_by' => $analysis->analyzer?->fullname,
        ];
    }
}

