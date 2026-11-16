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
        Schema::table('stations', function (Blueprint $table) {
            $table->string('ownership_type', 30)->default('SWASTA')->after('landlord_name');
            $table->index('ownership_type');
            $table->index('province');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stations', function (Blueprint $table) {
            $table->dropIndex(['ownership_type']);
            $table->dropIndex(['province']);
            $table->dropColumn('ownership_type');
        });
    }
};
