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
        Schema::table('project_plans', function (Blueprint $table) {
            $table->string('thumbnail_url')->nullable()->after('s3_key');
            $table->string('thumbnail_s3_key')->nullable()->after('thumbnail_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_plans', function (Blueprint $table) {
            $table->dropColumn(['thumbnail_url', 'thumbnail_s3_key']);
        });
    }
};

