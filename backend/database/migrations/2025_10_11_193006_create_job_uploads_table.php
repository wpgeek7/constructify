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
        Schema::create('job_uploads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_id')->constrained('project_jobs')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); // Who uploaded
            $table->enum('file_type', ['image', 'pdf', 'audio']); // Type of file
            $table->string('file_name'); // Original filename
            $table->string('file_path'); // Storage path
            $table->integer('file_size')->nullable(); // In bytes
            $table->text('transcription')->nullable(); // For audio files (converted to text)
            $table->text('description')->nullable(); // Optional description by worker
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_uploads');
    }
};
