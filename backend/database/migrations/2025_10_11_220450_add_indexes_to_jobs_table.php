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
        Schema::table('project_jobs', function (Blueprint $table) {
            // Add indexes for frequently queried columns
            $table->index('status');
            $table->index('job_id');
            $table->index('created_by');
            $table->index('created_at');
            $table->index(['status', 'created_at']); // Composite index for common query

            // Index for search queries
            $table->index('job_name');
            $table->index('client_name');
        });

        Schema::table('job_employee', function (Blueprint $table) {
            // Indexes already exist from foreign keys, but add composite for performance
            $table->index(['job_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_jobs', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['job_id']);
            $table->dropIndex(['created_by']);
            $table->dropIndex(['created_at']);
            $table->dropIndex(['status', 'created_at']);
            $table->dropIndex(['job_name']);
            $table->dropIndex(['client_name']);
        });

        Schema::table('job_employee', function (Blueprint $table) {
            $table->dropIndex(['job_id', 'user_id']);
        });
    }
};
