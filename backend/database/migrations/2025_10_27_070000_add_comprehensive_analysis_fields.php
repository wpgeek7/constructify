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
        Schema::table('ai_analyses', function (Blueprint $table) {
            // Add missing fields for comprehensive analysis
            $table->foreignId('analyzed_by')->nullable()->after('job_id')->constrained('users')->onDelete('set null');
            $table->text('detailed_description')->nullable()->after('caption');
            $table->integer('violations_count')->default(0)->after('has_violations');
            
            // People & Counting
            $table->integer('people_count')->default(0)->after('objects_detected');
            $table->json('people_details')->nullable()->after('people_count');
            
            // Scene Understanding
            $table->string('scene_type')->nullable()->after('people_details');
            $table->string('time_of_day')->nullable()->after('scene_type');
            $table->string('weather_condition')->nullable()->after('time_of_day');
            $table->string('lighting_quality')->nullable()->after('weather_condition');
            $table->text('scene_mood')->nullable()->after('lighting_quality');
            
            // Text & Activities
            $table->text('extracted_text')->nullable()->after('scene_mood');
            $table->json('text_locations')->nullable()->after('extracted_text');
            $table->json('activities_detected')->nullable()->after('text_locations');
            $table->text('primary_activity')->nullable()->after('activities_detected');
            
            // Visual Analysis
            $table->json('dominant_colors')->nullable()->after('primary_activity');
            $table->string('color_palette')->nullable()->after('dominant_colors');
            $table->text('visual_aesthetics')->nullable()->after('color_palette');
            
            // Quality Assessment
            $table->string('image_quality')->nullable()->after('visual_aesthetics');
            $table->boolean('is_blurry')->default(false)->after('image_quality');
            $table->boolean('is_overexposed')->default(false)->after('is_blurry');
            $table->boolean('is_underexposed')->default(false)->after('is_overexposed');
            $table->text('composition_notes')->nullable()->after('is_underexposed');
            
            // Metadata
            $table->string('ai_model_version')->nullable()->after('composition_notes');
            $table->json('raw_api_response')->nullable()->after('ai_model_version');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ai_analyses', function (Blueprint $table) {
            $table->dropForeign(['analyzed_by']);
            $table->dropColumn([
                'analyzed_by',
                'detailed_description',
                'violations_count',
                'people_count',
                'people_details',
                'scene_type',
                'time_of_day',
                'weather_condition',
                'lighting_quality',
                'scene_mood',
                'extracted_text',
                'text_locations',
                'activities_detected',
                'primary_activity',
                'dominant_colors',
                'color_palette',
                'visual_aesthetics',
                'image_quality',
                'is_blurry',
                'is_overexposed',
                'is_underexposed',
                'composition_notes',
                'ai_model_version',
                'raw_api_response',
            ]);
        });
    }
};

