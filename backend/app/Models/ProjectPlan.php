<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class ProjectPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_id',
        'uploaded_by',
        'file_name',
        'file_path',
        'file_type',
        'total_pages',
        'file_size',
        's3_key',
    ];

    protected $casts = [
        'total_pages' => 'integer',
        'file_size' => 'integer',
    ];

    /**
     * Get the job that owns the plan
     */
    public function job()
    {
        return $this->belongsTo(Job::class);
    }

    /**
     * Get the user who uploaded the plan
     */
    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /**
     * Get all measurements for this plan
     */
    public function measurements()
    {
        return $this->hasMany(PlanMeasurement::class, 'plan_id');
    }

    /**
     * Get all collaborators for this plan
     */
    public function collaborators()
    {
        return $this->hasMany(PlanCollaborator::class, 'plan_id');
    }

    /**
     * Get all teams assigned to this plan
     */
    public function teams()
    {
        return $this->belongsToMany(Team::class, 'plan_teams')
            ->withPivot('permission')
            ->withTimestamps();
    }

    /**
     * Get the file URL
     */
    public function getFileUrlAttribute()
    {
        $disk = config('filesystems.default');
        
        if ($disk === 's3') {
            return Storage::disk('s3')->url($this->s3_key);
        }
        
        // For local storage, return full URL with storage disk
        return Storage::disk('public')->url($this->file_path);
    }

    /**
     * Get temporary signed URL (valid for 1 hour) or regular URL for local
     */
    public function getSignedUrl()
    {
        $disk = config('filesystems.default');
        
        if ($disk === 's3') {
            return Storage::disk('s3')->temporaryUrl(
                $this->s3_key,
                now()->addHours(1)
            );
        }
        
        // For local storage, return public URL
        return Storage::disk('public')->url($this->file_path);
    }

    /**
     * Delete plan and its file from storage
     */
    public function deleteWithFile()
    {
        $disk = config('filesystems.default');
        
        // Delete from storage
        if ($disk === 's3') {
            if (Storage::disk('s3')->exists($this->s3_key)) {
                Storage::disk('s3')->delete($this->s3_key);
            }
        } else {
            if (Storage::disk('public')->exists($this->file_path)) {
                Storage::disk('public')->delete($this->file_path);
            }
        }

        // Delete measurements
        $this->measurements()->delete();

        // Delete record
        return $this->delete();
    }
}

