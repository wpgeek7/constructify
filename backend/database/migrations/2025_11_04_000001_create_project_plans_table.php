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
        Schema::create('project_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_id')->constrained('project_jobs')->onDelete('cascade');
            $table->foreignId('uploaded_by')->constrained('users')->onDelete('cascade');
            $table->string('file_name');
            $table->string('file_path'); // S3 path
            $table->string('file_type', 50); // pdf, image/png, image/jpeg
            $table->integer('total_pages')->default(1); // For PDFs
            $table->bigInteger('file_size')->nullable(); // bytes
            $table->string('s3_key'); // S3 object key for easy deletion
            $table->timestamps();

            $table->index('job_id');
            $table->index('uploaded_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_plans');
    }
};

