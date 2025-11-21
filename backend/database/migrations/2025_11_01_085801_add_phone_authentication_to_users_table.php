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
            // Phone authentication fields
            $table->string('phone_number', 20)->nullable()->unique()->after('email');
            $table->string('phone_country_code', 5)->default('+1')->after('phone_number');
            $table->timestamp('phone_verified_at')->nullable()->after('email_verified_at');
            $table->boolean('is_phone_verified')->default(false)->after('phone_verified_at');
            
            // OTP fields for phone verification
            $table->string('phone_otp', 6)->nullable()->after('is_phone_verified');
            $table->timestamp('phone_otp_expires_at')->nullable()->after('phone_otp');
            
            // Authentication preference (phone or email)
            $table->enum('auth_method', ['email', 'phone', 'google'])->default('phone')->after('phone_otp_expires_at');
            
            // Make email nullable since phone can be primary
            $table->string('email')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'phone_number',
                'phone_country_code',
                'phone_verified_at',
                'is_phone_verified',
                'phone_otp',
                'phone_otp_expires_at',
                'auth_method'
            ]);
            
            // Make email required again
            $table->string('email')->nullable(false)->change();
        });
    }
};
