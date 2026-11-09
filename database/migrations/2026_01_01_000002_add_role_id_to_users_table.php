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
            $table->string('role_id', 30)->default('VGREEN_REP')->after('email');
            $table->string('phone_number', 30)->nullable()->after('role_id');
            $table->string('organization', 100)->nullable()->after('phone_number'); // PT SSI, V-Green, Mitra Vendor
            $table->foreign('role_id')->references('id')->on('m_roles')->onUpdate('cascade')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropColumn(['role_id', 'phone_number', 'organization']);
        });
    }
};
