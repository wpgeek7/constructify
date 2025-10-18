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
        Schema::create('job_time_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_id')->constrained('project_jobs')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('action', ['start', 'pause', 'resume', 'stop']); // Timer actions
            $table->timestamp('action_time'); // When the action occurred
            $table->decimal('latitude', 10, 8)->nullable(); // GPS location at action time
            $table->decimal('longitude', 11, 8)->nullable();
            $table->text('notes')->nullable(); // Optional notes by worker
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_time_logs');
    }
};
