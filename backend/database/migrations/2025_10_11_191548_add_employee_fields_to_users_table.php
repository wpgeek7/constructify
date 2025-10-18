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
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
            $table->text('address')->nullable()->after('phone');
            $table->foreignId('role_id')->nullable()->after('role')->constrained('roles')->onDelete('set null');
            $table->enum('availability_status', ['available', 'on_job', 'on_leave', 'unavailable'])->default('available')->after('role_id');
            $table->enum('approval_status', ['pending', 'approved', 'rejected'])->default('pending')->after('availability_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropColumn(['phone', 'address', 'role_id', 'availability_status', 'approval_status']);
        });
    }
};
