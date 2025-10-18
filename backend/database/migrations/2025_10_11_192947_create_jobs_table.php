<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('project_jobs', function (Blueprint $table) {
            $table->id();
            $table->string('job_id')->unique(); // Auto-generated: JOB-2025-001
            $table->string('job_name');
            $table->text('job_description')->nullable();
            $table->string('client_name')->nullable();
            $table->string('site_contact')->nullable();
            $table->text('job_address')->nullable();
            $table->decimal('latitude', 10, 8)->nullable(); // For Google Maps
            $table->decimal('longitude', 11, 8)->nullable(); // For Google Maps
            $table->date('start_date')->nullable();
            $table->date('deadline')->nullable();
            $table->enum('status', ['pending', 'in_progress', 'completed', 'on_hold'])->default('pending');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null'); // Admin who created
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_jobs');
    }
};
