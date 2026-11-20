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
        // 1. Upgrade stations table with landlord profile & dual contract periods
        Schema::table('stations', function (Blueprint $table) {
            $table->string('landlord_type', 30)->default('SWASTA')->after('landlord_name'); // SWASTA, PEMERINTAH
            $table->string('landlord_phone', 50)->nullable()->after('landlord_type');
            
            // Dual Contract Periods
            // Contract 1: V-Green x PT SSI
            $table->date('contract_vgreen_start_date')->nullable()->after('landlord_phone');
            $table->date('contract_vgreen_end_date')->nullable()->after('contract_vgreen_start_date');
            $table->string('contract_vgreen_doc_number', 100)->nullable()->after('contract_vgreen_end_date');
            
            // Contract 2: PT SSI x Landlord
            $table->date('contract_landlord_start_date')->nullable()->after('contract_vgreen_doc_number');
            $table->date('contract_landlord_end_date')->nullable()->after('contract_landlord_start_date');
            $table->string('contract_landlord_doc_number', 100)->nullable()->after('contract_landlord_end_date');

            // Quick compliance cache
            $table->string('document_status', 30)->default('PENDING_UPLOAD')->after('contract_landlord_doc_number'); // COMPLETE, INCOMPLETE, PENDING_UPLOAD
            $table->index('landlord_type');
            $table->index('document_status');
        });

        // 2. Station Machines (1 Station -> Multiple Charging Units/BSS Cabinets)
        Schema::create('station_machines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('station_id')->constrained('stations')->cascadeOnDelete();
            $table->string('name', 150); // e.g. "Unit DC Fast Charger 01"
            $table->string('brand', 100)->default('Autel'); // Autel, Delta, ABB, Starcharge, V-Green
            $table->string('model_series', 100)->nullable(); // e.g. "MaxiCharger DC 120kW"
            $table->string('serial_number', 100)->nullable();
            $table->string('facility_type_id', 30)->default('EVCS'); // EVCS or BSS
            $table->integer('power_capacity_kw')->default(0); // 7, 22, 60, 120, 180 kW
            $table->string('socket_types', 255)->nullable(); // CCS2 Dual Gun, Type 2, BSS 8-Slot
            $table->integer('slot_or_gun_count')->default(2);
            $table->string('status', 30)->default('OPERATIONAL'); // OPERATIONAL, MAINTENANCE, OFFLINE
            $table->date('installed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('facility_type_id')->references('id')->on('m_facility_types')->onUpdate('cascade')->onDelete('restrict');
            $table->index(['station_id', 'facility_type_id']);
            $table->index('status');
        });

        // 3. Station Legal & Contract Documents
        Schema::create('station_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('station_id')->constrained('stations')->cascadeOnDelete();
            $table->string('category', 30); // SWASTA, PEMERINTAH, VENDOR
            $table->string('document_type', 50); // SHM, KTP, SURAT_PERSETUJUAN, LOI, PINJAM_PAKAI, MOU, KWITANSI, BUKTI_BAYAR, SK, SSR_VENDOR, LAPORAN_SURVEY
            $table->string('title', 255);
            $table->text('file_path')->nullable();
            $table->string('file_name', 255)->nullable();
            $table->integer('file_size')->nullable(); // in bytes
            $table->string('mime_type', 100)->nullable();
            $table->foreignUuid('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['station_id', 'category']);
            $table->index(['station_id', 'document_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('station_documents');
        Schema::dropIfExists('station_machines');

        Schema::table('stations', function (Blueprint $table) {
            $table->dropIndex(['landlord_type']);
            $table->dropIndex(['document_status']);
            $table->dropColumn([
                'landlord_type',
                'landlord_phone',
                'contract_vgreen_start_date',
                'contract_vgreen_end_date',
                'contract_vgreen_doc_number',
                'contract_landlord_start_date',
                'contract_landlord_end_date',
                'contract_landlord_doc_number',
                'document_status',
            ]);
        });
    }
};
