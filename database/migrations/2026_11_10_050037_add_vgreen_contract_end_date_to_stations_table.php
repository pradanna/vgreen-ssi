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
            $table->date('vgreen_contract_end_date')->nullable()->after('landlord_name');
            $table->index('vgreen_contract_end_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stations', function (Blueprint $table) {
            $table->dropIndex(['vgreen_contract_end_date']);
            $table->dropColumn(['vgreen_contract_end_date']);
        });
    }
};
