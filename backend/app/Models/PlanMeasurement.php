<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PlanMeasurement extends Model
{
    use HasFactory;

    protected $fillable = [
        'plan_id',
        'discipline_id',
        'created_by',
        'page_number',
        'layer_name',
        'type',
        'color',
        'coordinates',
        'value',
        'unit',
        'scale_info',
        'notes',
    ];

    protected $casts = [
        'coordinates' => 'array',
        'scale_info' => 'array',
        'value' => 'decimal:2',
        'page_number' => 'integer',
    ];

    /**
     * Get the plan that owns the measurement
     */
    public function plan()
    {
        return $this->belongsTo(ProjectPlan::class, 'plan_id');
    }

    /**
     * Get the user who created the measurement
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the discipline that owns the measurement
     */
    public function discipline()
    {
        return $this->belongsTo(MeasurementDiscipline::class, 'discipline_id');
    }

    /**
     * Scope to filter by plan
     */
    public function scopeForPlan($query, $planId)
    {
        return $query->where('plan_id', $planId);
    }

    /**
     * Scope to filter by page
     */
    public function scopeForPage($query, $pageNumber)
    {
        return $query->where('page_number', $pageNumber);
    }

    /**
     * Scope to filter by type
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }
}

