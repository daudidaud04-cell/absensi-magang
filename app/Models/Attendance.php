<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    protected $fillable = [
        'user_id', 'date', 'time_in', 'time_out', 'status', 'source',
        'lat_in', 'lng_in', 'lat_out', 'lng_out',
        'distance_in', 'distance_out', 'accuracy_in', 'accuracy_out',
        'image_in', 'image_out', 'logbook',
        'is_flagged', 'flag_notes', 'created_by', 'admin_notes',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
            'is_flagged' => 'boolean',
            'distance_in' => 'float',
            'distance_out' => 'float',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    /**
 * Filter terpusat. Dipakai Riwayat Absensi, dan nanti juga Rekap Bulanan.
 *
 * @param  array{dari?:?string,sampai?:?string,peserta?:?int,lokasi?:?int,divisi?:?int,status?:?string,flag?:?bool}  $f
 */
public function scopeFilter(Builder $query, array $f): Builder
{
    return $query
        ->when($f['dari'] ?? null, fn ($q, $v) => $q->whereDate('date', '>=', $v))
        ->when($f['sampai'] ?? null, fn ($q, $v) => $q->whereDate('date', '<=', $v))
        ->when($f['peserta'] ?? null, fn ($q, $v) => $q->where('user_id', $v))
        ->when($f['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
        ->when($f['flag'] ?? null, fn ($q) => $q->where('is_flagged', true))
        ->when($f['lokasi'] ?? null, fn ($q, $v) => $q->whereHas('user', fn ($u) => $u->where('location_id', $v)))
        ->when($f['divisi'] ?? null, fn ($q, $v) => $q->whereHas('user', fn ($u) => $u->where('division_id', $v)));
}
}