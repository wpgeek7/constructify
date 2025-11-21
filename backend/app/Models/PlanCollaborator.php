<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PlanCollaborator extends Model
{
    use HasFactory;

    protected $fillable = [
        'plan_id',
        'user_id',
        'role',
        'last_viewed_at',
        'last_edited_at',
    ];

    protected $casts = [
        'last_viewed_at' => 'datetime',
        'last_edited_at' => 'datetime',
    ];

    /**
     * Get the plan that owns the collaborator
     */
    public function plan()
    {
        return $this->belongsTo(ProjectPlan::class, 'plan_id');
    }

    /**
     * Get the user that is the collaborator
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

