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
        Schema::create('stations', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique(); // VG-JKT-001, etc.
            $table->string('name', 255);
            $table->string('facility_type_id', 30); // EVCS, BSS, COMBINED
            $table->string('status_id', 30); // OPERATIONAL, CONSTRUCTION, SURVEYED, ON_HOLD
            
            // Geographic Coordinates
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            
            // Location Address
            $table->text('address');
            $table->string('city', 100);
            $table->string('province', 100);
            $table->string('postal_code', 20)->nullable();
            
            // Technical Specs
            $table->integer('power_capacity_kw')->nullable(); // 60, 120, 180 kW
            $table->string('socket_types', 255)->nullable(); // CCS2 Dual Gun, Type 2, BSS 8-Slot
            $table->integer('slot_count')->default(2);
            $table->string('operational_hours', 100)->default('24 Jam');
            
            // Amenities (Rest Area, Minimarket, Toilet, Musholla, Coffee Shop)
            $table->json('amenities')->nullable();
            
            // Internal / Project Management Tracking
            $table->date('survey_date')->nullable();
            $table->date('construction_start_date')->nullable();
            $table->date('target_completion_date')->nullable();
            $table->date('commissioning_date')->nullable();
            $table->string('vendor_name', 150)->nullable();
            $table->string('pln_meter_id', 100)->nullable(); // PLN tracking ID
            $table->text('internal_notes')->nullable();
            
            $table->timestamps();

            // Foreign keys
            $table->foreign('facility_type_id')->references('id')->on('m_facility_types')->onUpdate('cascade')->onDelete('restrict');
            $table->foreign('status_id')->references('id')->on('m_station_statuses')->onUpdate('cascade')->onDelete('restrict');
            
            // Indexes
            $table->index(['latitude', 'longitude']);
            $table->index('facility_type_id');
            $table->index('status_id');
            $table->index('city');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stations');
    }
};
