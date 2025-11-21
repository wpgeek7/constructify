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
            // Change varchar columns to text for longer content
            $table->text('color_palette')->nullable()->change();
            $table->text('scene_type')->nullable()->change();
            $table->text('time_of_day')->nullable()->change();
            $table->text('weather_condition')->nullable()->change();
            $table->text('lighting_quality')->nullable()->change();
            $table->text('image_quality')->nullable()->change();
            $table->text('ai_model_version')->nullable()->change();
            $table->text('primary_activity')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ai_analyses', function (Blueprint $table) {
            $table->string('color_palette', 255)->nullable()->change();
            $table->string('scene_type', 255)->nullable()->change();
            $table->string('time_of_day', 255)->nullable()->change();
            $table->string('weather_condition', 255)->nullable()->change();
            $table->string('lighting_quality', 255)->nullable()->change();
            $table->string('image_quality', 255)->nullable()->change();
            $table->string('ai_model_version', 255)->nullable()->change();
            $table->string('primary_activity', 255)->nullable()->change();
        });
    }
};

