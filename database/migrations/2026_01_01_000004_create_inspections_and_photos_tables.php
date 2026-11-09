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
        // Laporan Inspeksi / Survei / Pembangunan Lapangan
        Schema::create('inspection_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('station_id')->constrained('stations')->cascadeOnDelete();
            $table->foreignId('submitted_by')->constrained('users')->cascadeOnDelete();
            $table->string('approval_status_id', 30)->default('PENDING_REVIEW');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            
            $table->string('stage', 50)->default('SURVEY'); // SURVEY, CONSTRUCTION, COMMISSIONING
            $table->text('notes')->nullable();
            $table->text('rejection_reason')->nullable();
            
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->foreign('approval_status_id')->references('id')->on('m_approval_statuses')->onUpdate('cascade')->onDelete('restrict');
            $table->index(['station_id', 'approval_status_id']);
        });

        // 7 Sudut Foto Dokumentasi Terverifikasi
        Schema::create('inspection_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')->constrained('inspection_reports')->cascadeOnDelete();
            $table->string('checklist_slot_id', 50); // LAHAN_DEPAN, MESIN_DEPAN, etc.
            
            $table->text('photo_url');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->timestamp('taken_at')->nullable();
            
            $table->boolean('is_approved')->default(false);
            $table->text('reviewer_notes')->nullable();
            $table->timestamps();

            $table->foreign('checklist_slot_id')->references('id')->on('m_checklist_slots')->onUpdate('cascade')->onDelete('restrict');
            $table->index(['report_id', 'checklist_slot_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inspection_photos');
        Schema::dropIfExists('inspection_reports');
    }
};
