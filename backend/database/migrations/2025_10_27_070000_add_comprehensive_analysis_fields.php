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
            // Add missing fields for comprehensive analysis (check if not exists)
            if (!Schema::hasColumn('ai_analyses', 'analyzed_by')) {
                $table->foreignId('analyzed_by')->nullable()->after('job_id')->constrained('users')->onDelete('set null');
            }
            if (!Schema::hasColumn('ai_analyses', 'detailed_description')) {
                $table->text('detailed_description')->nullable()->after('caption');
            }
            if (!Schema::hasColumn('ai_analyses', 'violations_count')) {
                $table->integer('violations_count')->default(0)->after('has_violations');
            }

            // People & Counting
            if (!Schema::hasColumn('ai_analyses', 'people_count')) {
                $table->integer('people_count')->default(0)->after('objects_detected');
            }
            if (!Schema::hasColumn('ai_analyses', 'people_details')) {
                $table->json('people_details')->nullable()->after('people_count');
            }

            // Scene Understanding
            if (!Schema::hasColumn('ai_analyses', 'scene_type')) {
                $table->string('scene_type')->nullable()->after('people_details');
            }
            if (!Schema::hasColumn('ai_analyses', 'time_of_day')) {
                $table->string('time_of_day')->nullable()->after('scene_type');
            }
            if (!Schema::hasColumn('ai_analyses', 'weather_condition')) {
                $table->string('weather_condition')->nullable()->after('time_of_day');
            }
            if (!Schema::hasColumn('ai_analyses', 'lighting_quality')) {
                $table->string('lighting_quality')->nullable()->after('weather_condition');
            }
            if (!Schema::hasColumn('ai_analyses', 'scene_mood')) {
                $table->text('scene_mood')->nullable()->after('lighting_quality');
            }

            // Text & Activities
            if (!Schema::hasColumn('ai_analyses', 'extracted_text')) {
                $table->text('extracted_text')->nullable()->after('scene_mood');
            }
            if (!Schema::hasColumn('ai_analyses', 'text_locations')) {
                $table->json('text_locations')->nullable()->after('extracted_text');
            }
            if (!Schema::hasColumn('ai_analyses', 'activities_detected')) {
                $table->json('activities_detected')->nullable()->after('text_locations');
            }
            if (!Schema::hasColumn('ai_analyses', 'primary_activity')) {
                $table->text('primary_activity')->nullable()->after('activities_detected');
            }

            // Visual Analysis
            if (!Schema::hasColumn('ai_analyses', 'dominant_colors')) {
                $table->json('dominant_colors')->nullable()->after('primary_activity');
            }
            if (!Schema::hasColumn('ai_analyses', 'color_palette')) {
                $table->string('color_palette')->nullable()->after('dominant_colors');
            }
            if (!Schema::hasColumn('ai_analyses', 'visual_aesthetics')) {
                $table->text('visual_aesthetics')->nullable()->after('color_palette');
            }

            // Quality Assessment
            if (!Schema::hasColumn('ai_analyses', 'image_quality')) {
                $table->string('image_quality')->nullable()->after('visual_aesthetics');
            }
            if (!Schema::hasColumn('ai_analyses', 'is_blurry')) {
                $table->boolean('is_blurry')->default(false)->after('image_quality');
            }
            if (!Schema::hasColumn('ai_analyses', 'is_overexposed')) {
                $table->boolean('is_overexposed')->default(false)->after('is_blurry');
            }
            if (!Schema::hasColumn('ai_analyses', 'is_underexposed')) {
                $table->boolean('is_underexposed')->default(false)->after('is_overexposed');
            }
            if (!Schema::hasColumn('ai_analyses', 'composition_notes')) {
                $table->text('composition_notes')->nullable()->after('is_underexposed');
            }

            // Metadata
            if (!Schema::hasColumn('ai_analyses', 'ai_model_version')) {
                $table->string('ai_model_version')->nullable()->after('composition_notes');
            }
            if (!Schema::hasColumn('ai_analyses', 'raw_api_response')) {
                $table->json('raw_api_response')->nullable()->after('ai_model_version');
            }
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

