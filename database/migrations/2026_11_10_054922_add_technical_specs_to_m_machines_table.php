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
        Schema::table('m_machines', function (Blueprint $table) {
            $table->string('dimensions', 100)->nullable()->after('slot_or_gun_count');
            $table->string('weight', 50)->nullable()->after('dimensions');
            $table->string('cable_length', 50)->nullable()->after('weight');
            $table->string('input_voltage', 150)->nullable()->after('cable_length');
            $table->string('input_current', 50)->nullable()->after('input_voltage');
            $table->string('output_voltage', 100)->nullable()->after('input_current');
            $table->string('output_current', 100)->nullable()->after('output_voltage');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_machines', function (Blueprint $table) {
            $table->dropColumn([
                'dimensions',
                'weight',
                'cable_length',
                'input_voltage',
                'input_current',
                'output_voltage',
                'output_current',
            ]);
        });
    }
};
