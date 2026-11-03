<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Carbon\CarbonPeriod;
use Illuminate\Support\Collection;

class RekapKehadiran
{
    /**
     * @param  Collection<int, User>  $users
     * @param  CarbonInterface|null  $dari    batas awal hitung (opsional, mis. awal bulan)
     * @param  CarbonInterface|null  $sampai  batas akhir hitung (opsional, mis. akhir bulan)
     * @return Collection<int, array{
     *     hari_kerja: int, hadir: int, terlambat: int, izin: int,
     *     sakit: int, alpha: int, persen: int|float|null, detail: array
     * }>
     */
    public static function untukPeserta(
        Collection $users,
        ?CarbonInterface $dari = null,
        ?CarbonInterface $sampai = null,
    ): Collection {
        // Batas akhir tidak boleh melewati hari ini
        $batas = $sampai && $sampai->lt(today()) ? $sampai->toDateString() : today()->toDateString();

        $records = Attendance::query()
            ->whereIn('user_id', $users->pluck('id'))
            ->when($dari, fn ($q, $v) => $q->whereDate('date', '>=', $v->toDateString()))
            ->whereDate('date', '<=', $batas)
            ->get()
            ->groupBy('user_id');

        return $users->mapWithKeys(fn (User $u) => [
            $u->id => self::hitung($u, $records->get($u->id, collect()), $dari, $sampai),
        ]);
    }

    /**
     * @param  Collection<int, Attendance>  $records
     * @return array{
     *     hari_kerja: int, hadir: int, terlambat: int, izin: int,
     *     sakit: int, alpha: int, persen: int|float|null, detail: array
     * }
     */
    public static function hitung(
        User $u,
        Collection $records,
        ?CarbonInterface $dari = null,
        ?CarbonInterface $sampai = null,
    ): array {
        $hasil = [
            'hari_kerja' => 0, 'hadir' => 0, 'terlambat' => 0,
            'izin' => 0, 'sakit' => 0, 'alpha' => 0,
            'persen' => null, 'detail' => [],
        ];

        if (! $u->start_date) {
            return $hasil;
        }

        $start = Carbon::parse($u->start_date)->startOfDay();
        $end   = $u->end_date ? Carbon::parse($u->end_date)->startOfDay()->min(today()) : today();

        // Persempit ke rentang yang diminta (mis. satu bulan)
        if ($dari) {
            $start = $start->max($dari->copy()->startOfDay());
        }
        if ($sampai) {
            $end = $end->copy()->min($sampai->copy()->startOfDay());
        }

        if ($start->gt($end)) {
            return $hasil;
        }

        $byDate = $records->keyBy(fn ($r) => Carbon::parse($r->date)->toDateString());

        // Hari sebelum akun peserta dibuat tidak dihitung alpha (kecuali sudah ada catatan absensi)
        $terdaftar = $u->created_at?->copy()->startOfDay();

        foreach (CarbonPeriod::create($start, $end) as $day) {
            $key   = $day->toDateString();
            $rec   = $byDate->get($key);
            $kerja = $u->isWorkday($day);

            if (! $rec && $terdaftar && $day->lt($terdaftar)) {
                continue; // belum terdaftar di sistem
            }

            if ($kerja && ! $rec && $day->isToday()) {
                continue; // hari ini belum selesai, belum dihitung alpha
            }

            if ($kerja) {
                $hasil['hari_kerja']++;

                if ($rec) {
                    if (in_array($rec->status, ['hadir', 'terlambat', 'izin', 'sakit', 'alpha'], true)) {
                        $hasil[$rec->status]++;
                    }
                } else {
                    $hasil['alpha']++;
                }
            }

            if (! $kerja && ! $rec) {
                continue;
            }

            $hasil['detail'][] = [
                'tanggal' => $key,
                'hari'    => $day->locale('id')->isoFormat('dddd'),
                'masuk'   => $rec?->time_in ? substr($rec->time_in, 0, 5) : '',
                'pulang'  => $rec?->time_out ? substr($rec->time_out, 0, 5) : '',
                'status'  => $rec ? $rec->status . ($kerja ? '' : ' (di luar jadwal)') : 'alpha (tanpa catatan)',
                'sumber'  => $rec?->source ?? '',
                'jarak'   => $rec?->distance_in !== null ? round($rec->distance_in) . ' m' : '',
                'catatan' => $rec?->admin_notes ?? '',
            ];
        }

        // Izin/sakit dikeluarkan dari pembagi. Pembagi 0 berarti persen null (tampil "-")
        $efektif = $hasil['hari_kerja'] - $hasil['izin'] - $hasil['sakit'];
        $hasil['persen'] = $efektif > 0
            ? round(($hasil['hadir'] + $hasil['terlambat']) / $efektif * 100)
            : null;

        return $hasil;
    }
}