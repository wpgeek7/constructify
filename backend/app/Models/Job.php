<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class Job extends Model
{
    protected $table = 'project_jobs';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'job_id',
        'job_name',
        'job_description',
        'client_name',
        'site_contact',
        'job_address',
        'latitude',
        'longitude',
        'start_date',
        'deadline',
        'status',
        'created_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'start_date' => 'date',
        'deadline' => 'date',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
    ];

    /**
     * Boot method to auto-generate job_id
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($job) {
            if (empty($job->job_id)) {
                $job->job_id = self::generateJobId();
            }
        });
    }

    /**
     * Generate unique job ID in format: JOB-2025-001
     */
    public static function generateJobId(): string
    {
        $year = Carbon::now()->year;
        $prefix = "JOB-{$year}-";

        // Get the last job ID for this year
        $lastJob = self::where('job_id', 'like', $prefix . '%')
            ->orderBy('job_id', 'desc')
            ->first();

        if ($lastJob) {
            // Extract the number and increment
            $lastNumber = (int) substr($lastJob->job_id, -3);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return $prefix . str_pad($newNumber, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Get the admin who created this job.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the employees assigned to this job (many-to-many).
     */
    public function employees(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'job_employee', 'job_id', 'user_id')
            ->withTimestamps()
            ->withPivot('is_notified');
    }

    /**
     * Get the time logs for this job.
     */
    public function timeLogs(): HasMany
    {
        return $this->hasMany(JobTimeLog::class);
    }

    /**
     * Get the uploaded files for this job.
     */
    public function uploads(): HasMany
    {
        return $this->hasMany(JobUpload::class);
    }

    /**
     * Check if job is overdue
     */
    public function isOverdue(): bool
    {
        if (!$this->deadline) {
            return false;
        }
        return Carbon::now()->isAfter($this->deadline) && $this->status !== 'completed';
    }

    /**
     * Get total time spent on this job (in hours)
     */
    public function getTotalTimeAttribute(): float
    {
        $logs = $this->timeLogs()
            ->orderBy('action_time')
            ->get();

        $totalSeconds = 0;
        $startTime = null;

        foreach ($logs as $log) {
            if ($log->action === 'start' || $log->action === 'resume') {
                $startTime = $log->action_time;
            } elseif (($log->action === 'pause' || $log->action === 'stop') && $startTime) {
                $totalSeconds += $log->action_time->diffInSeconds($startTime);
                $startTime = null;
            }
        }

        return round($totalSeconds / 3600, 2); // Convert to hours
    }

    /**
     * Get time spent per employee on this job
     * Returns array with employee_id => hours_spent
     */
    public function getTimePerEmployee(): array
    {
        $employeeTimes = [];

        // Get all employees assigned to this job
        $employees = $this->employees;

        foreach ($employees as $employee) {
            $logs = $this->timeLogs()
                ->where('user_id', $employee->id)
                ->orderBy('action_time')
                ->get();

            $totalSeconds = 0;
            $startTime = null;

            foreach ($logs as $log) {
                if ($log->action === 'start' || $log->action === 'resume') {
                    $startTime = $log->action_time;
                } elseif (($log->action === 'pause' || $log->action === 'stop') && $startTime) {
                    $totalSeconds += $log->action_time->diffInSeconds($startTime);
                    $startTime = null;
                }
            }

            $hours = round($totalSeconds / 3600, 2);

            $employeeTimes[] = [
                'employee_id' => $employee->id,
                'employee_name' => $employee->fullname,
                'employee_role' => $employee->employeeRole ? $employee->employeeRole->name : 'N/A',
                'hours_spent' => $hours,
                'formatted_time' => $this->formatHours($hours)
            ];
        }

        return $employeeTimes;
    }

    /**
     * Format hours to "X hours Y mins" format
     */
    private function formatHours(float $hours): string
    {
        $totalMinutes = round($hours * 60);
        $h = floor($totalMinutes / 60);
        $m = $totalMinutes % 60;

        if ($h > 0 && $m > 0) {
            return "{$h} hours {$m} mins";
        } elseif ($h > 0) {
            return "{$h} hours";
        } elseif ($m > 0) {
            return "{$m} mins";
        } else {
            return "0 mins";
        }
    }
}
