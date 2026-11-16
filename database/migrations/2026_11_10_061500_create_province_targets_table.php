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
        Schema::create('province_targets', function (Blueprint $table) {
            $table->id();
            $table->string('province_name');
            $table->string('region')->default('Jawa'); // Jawa, Sumatera, Kalimantan, Sulawesi, Bali-Nusra, Maluku-Papua
            $table->integer('year')->default(2026);
            $table->integer('target_evcs')->default(0);
            $table->integer('target_bss')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['province_name', 'year']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('province_targets');
    }
};
