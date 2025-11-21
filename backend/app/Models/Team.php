<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Team extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'icon',
        'description',
        'is_pro',
        'created_by',
    ];

    protected $casts = [
        'is_pro' => 'boolean',
    ];

    /**
     * Get the user who created the team
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the members of the team
     */
    public function members()
    {
        return $this->belongsToMany(User::class, 'team_members')
            ->withPivot('role')
            ->withTimestamps();
    }

    /**
     * Get the plans assigned to this team
     */
    public function plans()
    {
        return $this->belongsToMany(ProjectPlan::class, 'plan_teams')
            ->withPivot('permission')
            ->withTimestamps();
    }
}

