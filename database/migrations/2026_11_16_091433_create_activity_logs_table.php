<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();

            // Pelaku. Nama disimpan juga supaya log tetap terbaca walau admin dihapus.
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('user_name')->nullable();

            $table->string('action', 60)->index();          // contoh: peserta.dihapus
            $table->string('description');                  // kalimat yang tampil di halaman log

            // Objek yang terkena. Label disimpan karena datanya bisa sudah dihapus.
            $table->string('subject_type')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->string('subject_label')->nullable();

            $table->json('properties')->nullable();         // nilai sebelum/sesudah, dll
            $table->string('ip_address', 45)->nullable();

            $table->timestamp('created_at')->useCurrent()->index();

            $table->index(['subject_type', 'subject_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};