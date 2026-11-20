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
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('module', 30)->index(); // STATION, DOCUMENT, INSPECTION, TARGET, MASTER_DATA
            $table->string('action', 50)->index(); // STATION_CREATED, DOCUMENT_UPLOADED, etc.
            $table->string('subject_type', 100)->nullable();
            $table->string('subject_id', 50)->nullable();
            $table->string('subject_name', 255)->nullable();
            $table->text('description');
            $table->json('properties')->nullable(); // diff old/new values, metadata
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->index(['subject_type', 'subject_id']);
            $table->index(['module', 'created_at']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
