<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

class OfficeSetting extends Model
{
    protected $fillable = [
        'name', 'latitude', 'longitude', 'radius_meter',
        'jam_masuk', 'jam_pulang', 'pulang_dibuka_menit',
        'toleransi_terlambat_menit', 'max_gps_accuracy_meter',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'pulang_dibuka_menit' => 'integer',
        ];
    }

    /** Jam mulai absen pulang boleh dilakukan. */
    public function jamPulangDibuka(): Carbon
    {
        return Carbon::createFromTimeString($this->jam_pulang)
            ->subMinutes($this->pulang_dibuka_menit ?? 0);
    }
}