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
        Schema::create('plan_collaborators', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plan_id')->constrained('project_plans')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('role', ['owner', 'editor', 'viewer'])->default('viewer');
            $table->timestamp('last_viewed_at')->nullable();
            $table->timestamp('last_edited_at')->nullable();
            $table->timestamps();

            $table->unique(['plan_id', 'user_id']);
            $table->index('plan_id');
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plan_collaborators');
    }
};

