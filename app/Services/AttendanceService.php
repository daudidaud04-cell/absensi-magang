<?php

namespace App\Services;

use App\Models\OfficeSetting;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;

class AttendanceService
{
    /** Jarak dua koordinat dalam meter (Haversine). */
    public function distance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $r = 6371000;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return round(2 * $r * asin(sqrt($a)), 2);
    }

    /** Apakah absen pulang sudah boleh dilakukan sekarang. */
    public function isClockOutOpen(OfficeSetting $office): bool
    {
        return now()->gte($office->jamPulangDibuka());
    }

    /** Jam absen pulang dibuka, format "16.30" untuk ditampilkan di halaman. */
    public function clockOutOpensAt(OfficeSetting $office): string
    {
        return $office->jamPulangDibuka()->format('H.i');
    }

    /** Alasan absensi diblokir, atau null jika boleh absen. */
    public function blockedReason(User $user): ?string
    {
        if ($user->role !== 'magang') {
            return 'Akun admin tidak melakukan absensi.';
        }
        if (! $user->start_date || ! $user->end_date) {
            return 'Periode magang Anda belum diatur oleh admin.';
        }
        if ($user->status_magang === 'belum_mulai') {
            return 'Masa magang Anda belum dimulai.';
        }
        if ($user->status_magang === 'alumni') {
            return 'Masa magang telah berakhir (Alumni). Absensi dikunci.';
        }
        // Memakai pola kerja peserta (weekday / saturday_a / saturday_b)
        if (! $user->isWorkday(now())) {
            return 'Hari ini bukan hari kerja (akhir pekan atau hari libur).';
        }
        if (! OfficeSetting::exists()) {
            return 'Pengaturan kantor belum dibuat oleh admin.';
        }

        return null;
    }

    public function fail(string $message): never
    {
        throw ValidationException::withMessages(['absen' => $message]);
    }

    /** Validasi akurasi dan radius di server. Mengembalikan jarak (meter). */
    public function checkLocation(OfficeSetting $office, float $lat, float $lng, float $accuracy): float
    {
        if ($accuracy > $office->max_gps_accuracy_meter) {
            $this->fail('Akurasi GPS terlalu rendah ('.round($accuracy).' m). Pindah ke area terbuka lalu coba lagi.');
        }

        $distance = $this->distance($lat, $lng, $office->latitude, $office->longitude);

        if ($distance > $office->radius_meter) {
            $this->fail('Anda berada '.round($distance).' m dari kantor (maksimal '.$office->radius_meter.' m).');
        }

        return $distance;
    }

    /** Simpan foto ke disk privat (bukan public). */
    public function storePhoto(UploadedFile $file, int $userId): string
    {
        return $file->store("selfies/{$userId}", 'local');
    }
}