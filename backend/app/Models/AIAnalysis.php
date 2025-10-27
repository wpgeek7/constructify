<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AIAnalysis extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'ai_analyses';

    protected $fillable = [
        'upload_id',
        'job_id',
        'analyzed_by',
        'caption',
        'detailed_description',
        'safety_compliance',
        'compliance_score',
        'has_violations',
        'violations_count',
        'objects_detected',
        'people_count',
        'people_details',
        'scene_type',
        'time_of_day',
        'weather_condition',
        'lighting_quality',
        'scene_mood',
        'extracted_text',
        'text_locations',
        'activities_detected',
        'primary_activity',
        'dominant_colors',
        'color_palette',
        'visual_aesthetics',
        'image_quality',
        'is_blurry',
        'is_overexposed',
        'is_underexposed',
        'composition_notes',
        'processing_time_ms',
        'ai_model_version',
        'raw_api_response',
        'analyzed_at',
    ];

    protected $casts = [
        'safety_compliance' => 'array',
        'objects_detected' => 'array',
        'people_details' => 'array',
        'text_locations' => 'array',
        'activities_detected' => 'array',
        'dominant_colors' => 'array',
        'raw_api_response' => 'array',
        'has_violations' => 'boolean',
        'is_blurry' => 'boolean',
        'is_overexposed' => 'boolean',
        'is_underexposed' => 'boolean',
        'analyzed_at' => 'datetime',
    ];

    // Relationships
    public function upload()
    {
        return $this->belongsTo(JobUpload::class, 'upload_id');
    }

    public function job()
    {
        return $this->belongsTo(Job::class, 'job_id');
    }

    public function analyzer()
    {
        return $this->belongsTo(User::class, 'analyzed_by');
    }

    public function violations()
    {
        return $this->hasMany(SafetyViolation::class, 'analysis_id');
    }

    // Helper methods
    public function hasGoodQuality()
    {
        return in_array($this->image_quality, ['excellent', 'good']);
    }

    public function hasPeople()
    {
        return $this->people_count > 0;
    }

    public function hasText()
    {
        return !empty($this->extracted_text);
    }

    public function isWellLit()
    {
        return $this->lighting_quality === 'well-lit';
    }

    public function getComplianceLevel()
    {
        if ($this->compliance_score >= 90) return 'excellent';
        if ($this->compliance_score >= 75) return 'good';
        if ($this->compliance_score >= 60) return 'fair';
        return 'poor';
    }
}

