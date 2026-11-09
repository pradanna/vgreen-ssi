<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Master Lookup tables (Database-agnostic, no native ENUMs).
     */
    public function up(): void
    {
        // 1. Roles (Direktur, Admin, V-Green, Vendor, Tim Pembangunan)
        Schema::create('m_roles', function (Blueprint $table) {
            $table->string('id', 30)->primary(); // DIRECTOR_SSI, ADMIN_SSI, VGREEN_REP, FIELD_VENDOR, CONSTRUCTION_TEAM
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // 2. Facility Types (EVCS Mobil, BSS Motor, Kombinasi)
        Schema::create('m_facility_types', function (Blueprint $table) {
            $table->string('id', 30)->primary(); // EVCS, BSS, COMBINED
            $table->string('name', 100);
            $table->string('icon_name', 50)->default('car');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // 3. Station Statuses (OPERATIONAL, CONSTRUCTION, SURVEYED, ON_HOLD)
        Schema::create('m_station_statuses', function (Blueprint $table) {
            $table->string('id', 30)->primary(); // OPERATIONAL, CONSTRUCTION, SURVEYED, ON_HOLD
            $table->string('name', 100);
            $table->string('color_code', 20); // Hex color
            $table->integer('step_order')->default(1);
            $table->timestamps();
        });

        // 4. Checklist Photo Slots (7 Sudut Terstandarisasi)
        Schema::create('m_checklist_slots', function (Blueprint $table) {
            $table->string('id', 50)->primary(); // LAHAN_DEPAN, MESIN_DEPAN, etc.
            $table->string('category', 50); // LAHAN, MESIN, PANEL_TIANG
            $table->string('label', 100);
            $table->string('angle', 50);
            $table->boolean('is_required')->default(true);
            $table->timestamps();
        });

        // 5. Approval Statuses (PENDING_REVIEW, APPROVED, REVISION_REQUIRED)
        Schema::create('m_approval_statuses', function (Blueprint $table) {
            $table->string('id', 30)->primary(); // PENDING_REVIEW, APPROVED, REVISION_REQUIRED
            $table->string('name', 100);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_approval_statuses');
        Schema::dropIfExists('m_checklist_slots');
        Schema::dropIfExists('m_station_statuses');
        Schema::dropIfExists('m_facility_types');
        Schema::dropIfExists('m_roles');
    }
};
