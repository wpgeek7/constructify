<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MeasurementDiscipline extends Model
{
    protected $fillable = [
        'plan_id',
        'name',
        'icon',
        'color',
        'order',
    ];

    public function plan(): BelongsTo
    {
        return $this->belongsTo(ProjectPlan::class);
    }

    public function measurements(): HasMany
    {
        return $this->hasMany(PlanMeasurement::class, 'discipline_id');
    }
}

