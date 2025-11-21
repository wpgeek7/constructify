<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'fullname',
        'email',
        'password',
        'role',
        'phone',
        'phone_number',
        'phone_country_code',
        'phone_verified_at',
        'is_phone_verified',
        'phone_otp',
        'phone_otp_expires_at',
        'auth_method',
        'address',
        'role_id',
        'availability_status',
        'approval_status',
        'verification_code',
        'verification_code_expires_at',
        'is_verified',
        'google_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'verification_code',
        'phone_otp',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'verification_code_expires_at' => 'datetime',
            'phone_otp_expires_at' => 'datetime',
            'password' => 'hashed',
            'is_verified' => 'boolean',
            'is_phone_verified' => 'boolean',
        ];
    }

    /**
     * Check if user is an admin
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Check if user is an employee
     */
    public function isEmployee(): bool
    {
        return $this->role === 'employee';
    }

    /**
     * Get the employee role (position) for this user.
     */
    public function employeeRole()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    /**
     * Check if employee is approved
     */
    public function isApproved(): bool
    {
        return $this->approval_status === 'approved';
    }

    /**
     * Check if employee is pending approval
     */
    public function isPending(): bool
    {
        return $this->approval_status === 'pending';
    }

    /**
     * Get jobs assigned to this employee (many-to-many).
     */
    public function jobs()
    {
        return $this->belongsToMany(Job::class, 'job_employee', 'user_id', 'job_id')
            ->withTimestamps()
            ->withPivot('is_notified');
    }
}
