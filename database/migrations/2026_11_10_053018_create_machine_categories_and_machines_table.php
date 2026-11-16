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
        // 1. Master Kategori Mesin (EVCS, BSS)
        Schema::create('m_machine_categories', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique(); // EVCS, BSS
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // 2. Master Katalog Mesin / Model Series
        Schema::create('m_machines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('m_machine_categories')->cascadeOnUpdate()->restrictOnDelete();
            $table->string('code', 50)->unique(); // e.g. AUTEL-DC-120, DELTA-AC-22, BSS-GEN3-8S
            $table->string('name', 150); // e.g. Autel MaxiCharger DC 120kW
            $table->string('brand', 100); // Autel, Delta, ABB, Starcharge, V-Green
            $table->string('model_series', 100)->nullable();
            $table->integer('power_capacity_kw')->default(0);
            $table->string('socket_types', 255)->nullable(); // 2x CCS2 Fast Gun, Type 2, 8-Slot Swap
            $table->integer('slot_or_gun_count')->default(2);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('category_id');
            $table->index('brand');
            $table->index('is_active');
        });

        // 3. Connect station_machines to master m_machines (backward-compatible nullable FK)
        Schema::table('station_machines', function (Blueprint $table) {
            $table->foreignId('machine_id')->nullable()->after('station_id')->constrained('m_machines')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('station_machines', function (Blueprint $table) {
            $table->dropForeign(['machine_id']);
            $table->dropColumn('machine_id');
        });

        Schema::dropIfExists('m_machines');
        Schema::dropIfExists('m_machine_categories');
    }
};
