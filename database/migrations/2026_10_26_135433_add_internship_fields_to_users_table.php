<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'magang'])->default('magang')->after('password');
            $table->string('nim_nis', 50)->nullable()->after('role');
            $table->string('phone', 20)->nullable()->after('nim_nis');
            $table->string('instansi')->nullable()->after('phone');
            $table->string('divisi')->nullable()->after('instansi');
            $table->string('pembimbing')->nullable()->after('divisi');
            $table->date('start_date')->nullable()->after('pembimbing');
            $table->date('end_date')->nullable()->after('start_date');
            $table->enum('certificate_status', ['belum_diberikan', 'siap_diambil', 'sudah_diserahkan'])
                ->default('belum_diberikan')
                ->after('end_date');

            $table->index('role');
            $table->index(['start_date', 'end_date']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role']);
            $table->dropIndex(['start_date', 'end_date']);
            $table->dropColumn([
                'role', 'nim_nis', 'phone', 'instansi', 'divisi',
                'pembimbing', 'start_date', 'end_date', 'certificate_status',
            ]);
        });
    }
};