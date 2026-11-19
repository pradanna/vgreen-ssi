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
        // 1. Add condition assessment & submission GPS audit to inspection_reports
        Schema::table('inspection_reports', function (Blueprint $table) {
            $table->string('overall_condition', 30)->default('BAIK')->after('stage'); // BAIK, CUKUP, RUSAK_RINGAN, RUSAK_BERAT
            $table->text('physical_condition')->nullable()->after('overall_condition');
            $table->text('electrical_condition')->nullable()->after('physical_condition');
            $table->json('issues_found')->nullable()->after('electrical_condition');
            $table->json('machine_conditions')->nullable()->after('issues_found');
            
            // Submission GPS audit
            $table->decimal('latitude', 10, 7)->nullable()->after('machine_conditions');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $table->decimal('distance_meters', 10, 2)->nullable()->after('longitude');
            
            $table->index('overall_condition');
        });

        // 2. Add distance_meters to inspection_photos for per-photo distance audit
        Schema::table('inspection_photos', function (Blueprint $table) {
            $table->decimal('distance_meters', 10, 2)->nullable()->after('longitude');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inspection_photos', function (Blueprint $table) {
            $table->dropColumn(['distance_meters']);
        });

        Schema::table('inspection_reports', function (Blueprint $table) {
            $table->dropIndex(['overall_condition']);
            $table->dropColumn([
                'overall_condition',
                'physical_condition',
                'electrical_condition',
                'issues_found',
                'machine_conditions',
                'latitude',
                'longitude',
                'distance_meters',
            ]);
        });
    }
};
