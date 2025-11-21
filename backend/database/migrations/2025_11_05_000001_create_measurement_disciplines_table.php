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
        // Create disciplines table
        Schema::create('measurement_disciplines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plan_id')->constrained('project_plans')->onDelete('cascade');
            $table->string('name'); // e.g., "Electrical - SD", "Mechanical", "Architectural"
            $table->string('icon')->nullable(); // emoji or icon identifier
            $table->string('color', 7)->default('#82eaff'); // hex color
            $table->integer('order')->default(0); // for sorting
            $table->timestamps();
            
            $table->index(['plan_id', 'order']);
        });

        // Add discipline_id to plan_measurements
        Schema::table('plan_measurements', function (Blueprint $table) {
            $table->foreignId('discipline_id')->nullable()->after('plan_id')->constrained('measurement_disciplines')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('plan_measurements', function (Blueprint $table) {
            $table->dropForeign(['discipline_id']);
            $table->dropColumn('discipline_id');
        });
        
        Schema::dropIfExists('measurement_disciplines');
    }
};

