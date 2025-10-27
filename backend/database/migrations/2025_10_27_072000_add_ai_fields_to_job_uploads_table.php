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
            if (!Schema::hasColumn('job_uploads', 'ai_analyzed')) {
                $table->boolean('ai_analyzed')->default(false)->after('description');
            }
            if (!Schema::hasColumn('job_uploads', 'ai_analysis_id')) {
                $table->foreignId('ai_analysis_id')->nullable()->constrained('ai_analyses')->onDelete('set null')->after('ai_analyzed');
            }
            if (!Schema::hasColumn('job_uploads', 'ai_analyzed_at')) {
                $table->timestamp('ai_analyzed_at')->nullable()->after('ai_analysis_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_uploads', function (Blueprint $table) {
            if (Schema::hasColumn('job_uploads', 'ai_analysis_id')) {
                $table->dropForeign(['ai_analysis_id']);
            }
            $table->dropColumn(['ai_analyzed', 'ai_analysis_id', 'ai_analyzed_at']);
        });
    }
};

