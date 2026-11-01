<?php

namespace Database\Seeders;

use App\Models\OfficeSetting;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::forceCreate([
            'name' => 'Admin SIAM',
            'email' => 'admin@siam.test',
            'password' => 'password',
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        User::forceCreate([
            'name' => 'Peserta Contoh',
            'email' => 'peserta@siam.test',
            'password' => 'password',
            'role' => 'magang',
            'instansi' => 'Universitas Contoh',
            'start_date' => today()->subDays(7),
            'end_date' => today()->addMonths(3),
            'email_verified_at' => now(),
        ]);

        // Koordinat Training Center RAPP. Cek lagi lewat menu Pengaturan setelah login sebagai admin.
        OfficeSetting::create([
            'name' => 'Training Center RAPP',
            'latitude' => 0.44748,
            'longitude' => 101.9010888,
            'radius_meter' => 100,
            'jam_masuk' => '08:00',
            'jam_pulang' => '17:00',
            'pulang_dibuka_menit' => 30,
            'toleransi_terlambat_menit' => 15,
            'max_gps_accuracy_meter' => 100,
        ]);
    }
}