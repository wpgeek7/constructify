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
        Schema::table('job_uploads', function (Blueprint $table) {
            $table->boolean('ai_analyzed')->default(false)->after('description');
            $table->foreignId('ai_analysis_id')->nullable()->constrained('ai_analyses')->onDelete('set null')->after('ai_analyzed');
            $table->timestamp('ai_analyzed_at')->nullable()->after('ai_analysis_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_uploads', function (Blueprint $table) {
            $table->dropForeign(['ai_analysis_id']);
            $table->dropColumn(['ai_analyzed', 'ai_analysis_id', 'ai_analyzed_at']);
        });
    }
};

