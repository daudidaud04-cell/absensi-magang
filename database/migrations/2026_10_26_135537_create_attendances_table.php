<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date');

            $table->time('time_in')->nullable();
            $table->time('time_out')->nullable();

            $table->enum('status', ['hadir', 'terlambat', 'izin', 'sakit', 'alpha']);
            $table->enum('source', ['self', 'manual'])->default('self');

            // Bukti lokasi (untuk audit)
            $table->decimal('lat_in', 10, 7)->nullable();
            $table->decimal('lng_in', 10, 7)->nullable();
            $table->decimal('lat_out', 10, 7)->nullable();
            $table->decimal('lng_out', 10, 7)->nullable();
            $table->decimal('distance_in', 8, 2)->nullable();
            $table->decimal('distance_out', 8, 2)->nullable();
            $table->decimal('accuracy_in', 8, 2)->nullable();
            $table->decimal('accuracy_out', 8, 2)->nullable();

            // Path foto di storage privat
            $table->string('image_in')->nullable();
            $table->string('image_out')->nullable();

            $table->text('logbook')->nullable();

            // Penandaan absen mencurigakan oleh admin
            $table->boolean('is_flagged')->default(false);
            $table->text('flag_notes')->nullable();

            // Absen manual oleh admin
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('admin_notes')->nullable();

            $table->timestamps();

            $table->unique(['user_id', 'date']);
            $table->index(['date', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};