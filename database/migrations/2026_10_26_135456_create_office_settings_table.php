<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('office_settings', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->unsignedSmallInteger('radius_meter')->default(50);
            $table->time('jam_masuk')->default('08:00:00');
            $table->time('jam_pulang')->default('16:00:00');
            $table->unsignedSmallInteger('pulang_dibuka_menit')->default(30);
            $table->unsignedSmallInteger('toleransi_terlambat_menit')->default(15);
            $table->unsignedSmallInteger('max_gps_accuracy_meter')->default(50);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('office_settings');
    }
};