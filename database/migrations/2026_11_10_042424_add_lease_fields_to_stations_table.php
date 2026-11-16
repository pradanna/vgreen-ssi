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
            $table->date('lease_end_date')->nullable()->after('internal_notes');
            $table->string('landlord_name', 150)->nullable()->after('lease_end_date');
            $table->index('lease_end_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stations', function (Blueprint $table) {
            $table->dropIndex(['lease_end_date']);
            $table->dropColumn(['lease_end_date', 'landlord_name']);
        });
    }
};
