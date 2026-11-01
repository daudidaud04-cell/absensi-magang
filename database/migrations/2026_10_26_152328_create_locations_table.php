<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('locations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('location_id')->nullable()->after('divisi')
                ->constrained('locations')->nullOnDelete();
        });

        // Pindahkan data placement lama ke tabel locations
        $now = now();
        $defaults = [
            'training_center' => 'Training Center',
            'office' => 'Office',
            'workshop' => 'Workshop',
        ];

        foreach ($defaults as $key => $name) {
            $id = DB::table('locations')->insertGetId([
                'name' => $name,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            DB::table('users')->where('placement', $key)->update(['location_id' => $id]);
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('placement');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('placement', 30)->nullable()->after('divisi');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('location_id');
        });

        Schema::dropIfExists('locations');
    }
};