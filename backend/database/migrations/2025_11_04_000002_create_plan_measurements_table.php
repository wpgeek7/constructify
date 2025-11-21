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
        Schema::create('plan_measurements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plan_id')->constrained('project_plans')->onDelete('cascade');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->integer('page_number')->default(1);
            $table->string('layer_name');
            $table->string('type', 50); // line, polyline, area, count
            $table->string('color', 7); // hex color
            $table->json('coordinates'); // Array of {x, y} points
            $table->decimal('value', 10, 2)->nullable(); // Calculated measurement
            $table->string('unit', 50)->nullable(); // feet, square_feet, count
            $table->json('scale_info')->nullable(); // Calibration data per page
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('plan_id');
            $table->index('created_by');
            $table->index('page_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plan_measurements');
    }
};

