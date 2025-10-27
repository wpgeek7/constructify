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
        Schema::create('ai_analyses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('upload_id')->constrained('job_uploads')->onDelete('cascade');
            $table->foreignId('job_id')->constrained('project_jobs')->onDelete('cascade');
            $table->foreignId('analyzed_by')->nullable()->constrained('users')->onDelete('set null');

            // Basic Analysis
            $table->text('caption')->nullable(); // General image description
            $table->text('detailed_description')->nullable(); // Comprehensive what's in the image

            // Construction Safety (existing)
            $table->json('safety_compliance')->nullable(); // Safety checks
            $table->integer('compliance_score')->default(0); // 0-100
            $table->boolean('has_violations')->default(false);
            $table->integer('violations_count')->default(0);

            // Object Identification
            $table->json('objects_detected')->nullable(); // List of objects, people, animals
            $table->integer('people_count')->default(0);
            $table->json('people_details')->nullable(); // Info about people detected

            // Scene Understanding
            $table->string('scene_type')->nullable(); // indoor/outdoor/construction_site/etc
            $table->string('time_of_day')->nullable(); // morning/afternoon/evening/night
            $table->string('weather_condition')->nullable(); // sunny/cloudy/rainy/etc
            $table->string('lighting_quality')->nullable(); // well-lit/dim/bright/etc
            $table->text('scene_mood')->nullable(); // professional/casual/busy/calm/etc

            // Text Extraction (OCR)
            $table->text('extracted_text')->nullable(); // All text found in image
            $table->json('text_locations')->nullable(); // Where text was found

            // Activity Recognition
            $table->json('activities_detected')->nullable(); // What people are doing
            $table->text('primary_activity')->nullable(); // Main activity in the image

            // Color Analysis
            $table->json('dominant_colors')->nullable(); // Top 5 colors with percentages
            $table->string('color_palette')->nullable(); // Overall color scheme
            $table->text('visual_aesthetics')->nullable(); // Composition, balance, etc

            // Quality Assessment
            $table->string('image_quality')->nullable(); // excellent/good/fair/poor
            $table->boolean('is_blurry')->default(false);
            $table->boolean('is_overexposed')->default(false);
            $table->boolean('is_underexposed')->default(false);
            $table->text('composition_notes')->nullable(); // Framing, focus, clarity

            // Metadata
            $table->integer('processing_time_ms')->nullable(); // How long analysis took
            $table->string('ai_model_version')->nullable(); // Moondream version used
            $table->json('raw_api_response')->nullable(); // Store full API response
            $table->timestamp('analyzed_at')->nullable();

            $table->timestamps();

            // Indexes
            $table->index('job_id');
            $table->index('upload_id');
            $table->index('has_violations');
            $table->index('compliance_score');
            $table->index('scene_type');
            $table->index('image_quality');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_analyses');
    }
};

