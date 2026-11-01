<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('education_level', 20)->default('perguruan_tinggi')->after('role');
            $table->string('major')->nullable()->after('instansi');
            $table->string('placement', 30)->nullable()->after('divisi');
            $table->string('school_supervisor')->nullable()->after('pembimbing');
            $table->string('guardian_phone', 20)->nullable()->after('phone');
            $table->string('letter_number', 100)->nullable()->after('end_date');
            $table->string('certificate_number', 100)->nullable()->after('certificate_status');
            $table->date('certificate_date')->nullable()->after('certificate_number');

            $table->index('education_level');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['education_level']);
            $table->dropColumn([
                'education_level', 'major', 'placement', 'school_supervisor',
                'guardian_phone', 'letter_number', 'certificate_number', 'certificate_date',
            ]);
        });
    }
};