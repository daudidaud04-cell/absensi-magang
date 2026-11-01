<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\OfficeSetting;
use App\Services\AttendanceService;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class AbsensiController extends Controller
{
    /** Beranda peserta */
    public function index(Request $request, AttendanceService $svc)
    {
        $user = $request->user();
        $today = today();
        $office = OfficeSetting::first();

        $todayRow = Attendance::query()
            ->where('user_id', $user->id)
            ->whereDate('date', $today->toDateString())
            ->first();

        // Ringkasan Senin-Minggu pekan ini
        $weekStart = $today->copy()->startOfWeek();
        $weekEnd = $weekStart->copy()->addDays(6);
        $weekRows = Attendance::query()
            ->where('user_id', $user->id)
            ->whereBetween('date', [$weekStart->toDateString(), $weekEnd->toDateString()])
            ->get()
            ->keyBy(fn ($a) => $a->date->toDateString());
        $labels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

        $week = collect(range(0, 6))->map(function ($i) use ($weekStart, $weekRows, $labels, $today, $user) {
            $d = $weekStart->copy()->addDays($i);
            $key = $d->toDateString();

            return [
                'date' => $key,
                'label' => $labels[$i],
                'status' => $weekRows->get($key)?->status,
                // Memakai pola kerja peserta (sudah termasuk cek hari libur)
                'workday' => $user->isWorkday($d),
                'is_today' => $d->isSameDay($today),
            ];
        })->values();

        $recent = Attendance::query()
            ->where('user_id', $user->id)
            ->orderByDesc('date')
            ->limit(3)
            ->get()
            ->map(fn ($a) => $this->decorate($a, $office))
            ->values();

        return Inertia::render('absensi/index', [
            'profile' => [
                'name' => $user->name,
                'instansi' => $user->instansi,
                'start_date' => $user->start_date?->toDateString(),
                'end_date' => $user->end_date?->toDateString(),
                'status_magang' => $user->status_magang,
                'sisa_hari' => $user->end_date ? max(0, (int) $today->diffInDays($user->end_date, false)) : null,
            ],
            'office' => $office
                ? array_merge($office->toArray(), [
                    'pulang_dibuka' => $office->jamPulangDibuka()->format('H:i'),
                ])
                : null,
            'today' => $todayRow ? $this->decorate($todayRow, $office) : null,
            'blocked' => $svc->blockedReason($user),
            'week' => $week,
            'recent' => $recent,
        ]);
    }

    /** Layar absen (lokasi, selfie, kirim) */
    public function form(Request $request, AttendanceService $svc)
    {
        $user = $request->user();
        $office = OfficeSetting::first();

        if ($svc->blockedReason($user) || ! $office) {
            return redirect('/absensi');
        }

        $today = Attendance::query()
            ->where('user_id', $user->id)
            ->whereDate('date', today()->toDateString())
            ->first();

        // Hari ini berstatus izin/sakit/alpha (tanpa jam masuk)
        if ($today && ! $today->time_in) {
            return redirect('/absensi');
        }

        // Sudah absen masuk dan pulang: tampilkan ringkasan
        if ($today && $today->time_out) {
            return Inertia::render('absensi/berhasil', ['record' => $this->decorate($today, $office)]);
        }

        return Inertia::render('absensi/absen', [
            'mode' => $today ? 'pulang' : 'masuk',
            'office' => array_merge($office->toArray(), [
                'pulang_dibuka' => $office->jamPulangDibuka()->format('H:i'),
            ]),
            'today' => $today ? $this->decorate($today, $office) : null,
        ]);
    }

    /** Layar sukses */
    public function berhasil(Request $request)
    {
        $office = OfficeSetting::first();
        $row = Attendance::query()
            ->where('user_id', $request->user()->id)
            ->whereDate('date', today()->toDateString())
            ->first();

        if (! $row || ! $row->time_in) {
            return redirect('/absensi');
        }

        return Inertia::render('absensi/berhasil', ['record' => $this->decorate($row, $office)]);
    }

    /** Riwayat per bulan */
    public function riwayat(Request $request)
    {
        $user = $request->user();
        $office = OfficeSetting::first();

        $param = (string) $request->query('month');
        $month = preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $param) ? $param : today()->format('Y-m');
        $start = Carbon::createFromFormat('Y-m-d', $month.'-01')->startOfDay();
        $end = $start->copy()->endOfMonth();

        $records = Attendance::query()
            ->where('user_id', $user->id)
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->orderByDesc('date')
            ->get()
            ->map(fn ($a) => $this->decorate($a, $office))
            ->values();

        // Hari kerja yang sudah berjalan dalam bulan ini dan dalam periode magang
        $from = $start->copy();
        if ($user->start_date && $user->start_date->gt($from)) {
            $from = $user->start_date->copy();
        }
        $to = $end->copy();
        if (today()->lt($to)) {
            $to = today();
        }
        if ($user->end_date && $user->end_date->lt($to)) {
            $to = $user->end_date->copy();
        }

        $workdays = 0;
        if ($from->lte($to)) {
            foreach (CarbonPeriod::create($from, $to) as $d) {
                // Memakai pola kerja peserta (sudah termasuk cek hari libur)
                if ($user->isWorkday($d)) {
                    $workdays++;
                }
            }
        }

        $next = $start->copy()->addMonth();

        return Inertia::render('riwayat', [
            'month' => $month,
            'prev' => $start->copy()->subMonth()->format('Y-m'),
            'next' => $next->lte(today()) ? $next->format('Y-m') : null,
            'summary' => [
                'present' => $records->whereIn('status', ['hadir', 'terlambat'])->count(),
                'workdays' => $workdays,
            ],
            'records' => $records,
        ]);
    }

    public function masuk(Request $request, AttendanceService $svc)
    {
        $request->validate([
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png', 'max:512'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'accuracy' => ['required', 'numeric', 'min:0'],
        ]);

        $user = $request->user();
        if ($reason = $svc->blockedReason($user)) {
            $svc->fail($reason);
        }

        $office = OfficeSetting::firstOrFail();
        $now = now(); // waktu server, bukan jam perangkat
        $date = $now->toDateString();

        if ($now->format('H:i:s') > $office->jam_pulang) {
            $svc->fail('Sudah melewati jam kerja. Hubungi admin untuk absen manual.');
        }
        if (Attendance::query()->where('user_id', $user->id)->whereDate('date', $date)->exists()) {
            $svc->fail('Absensi hari ini sudah tercatat.');
        }

        $distance = $svc->checkLocation(
            $office, (float) $request->latitude, (float) $request->longitude, (float) $request->accuracy
        );
        $path = $svc->storePhoto($request->file('photo'), $user->id);

        $batasTelat = Carbon::parse($date.' '.$office->jam_masuk)->addMinutes($office->toleransi_terlambat_menit);

        try {
            Attendance::create([
                'user_id' => $user->id,
                'date' => $date,
                'time_in' => $now->format('H:i:s'),
                'status' => $now->gt($batasTelat) ? 'terlambat' : 'hadir',
                'source' => 'self',
                'lat_in' => $request->latitude,
                'lng_in' => $request->longitude,
                'distance_in' => $distance,
                'accuracy_in' => $request->accuracy,
                'image_in' => $path,
            ]);
        } catch (UniqueConstraintViolationException) {
            Storage::disk('local')->delete($path);
            $svc->fail('Absensi hari ini sudah tercatat.');
        }

        return redirect('/absensi/berhasil');
    }

    public function pulang(Request $request, AttendanceService $svc)
    {
        $request->validate([
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png', 'max:512'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'accuracy' => ['required', 'numeric', 'min:0'],
            'logbook' => ['required', 'string', 'min:10', 'max:2000'],
        ], ['logbook.required' => 'Jurnal kegiatan wajib diisi sebelum absen pulang.',
            'logbook.min' => 'Jurnal kegiatan minimal 10 karakter.']);

        $user = $request->user();
        if ($reason = $svc->blockedReason($user)) {
            $svc->fail($reason);
        }

        $office = OfficeSetting::firstOrFail();
        $now = now();

        $attendance = Attendance::query()
            ->where('user_id', $user->id)
            ->whereDate('date', $now->toDateString())
            ->first();
        if (! $attendance || ! $attendance->time_in) {
            $svc->fail('Anda belum absen masuk hari ini.');
        }
        if ($attendance->time_out) {
            $svc->fail('Anda sudah absen pulang hari ini.');
        }

        // Pakai jam pembukaan absen pulang (jam pulang dikurangi pulang_dibuka_menit)
        if (! $svc->isClockOutOpen($office)) {
            $svc->fail('Belum waktunya pulang. Absen pulang dibuka pukul '.$svc->clockOutOpensAt($office).'.');
        }

        $distance = $svc->checkLocation(
            $office, (float) $request->latitude, (float) $request->longitude, (float) $request->accuracy
        );
        $path = $svc->storePhoto($request->file('photo'), $user->id);

        $attendance->update([
            'time_out' => $now->format('H:i:s'),
            'lat_out' => $request->latitude,
            'lng_out' => $request->longitude,
            'distance_out' => $distance,
            'accuracy_out' => $request->accuracy,
            'image_out' => $path,
            'logbook' => $request->logbook,
        ]);

        return redirect('/absensi/berhasil');
    }

    /**
     * Tambahkan menit keterlambatan (dihitung dari jam masuk) dan durasi kerja.
     *
     * @param  mixed  $a
     */
    private function decorate($a, ?OfficeSetting $office): array
    {
        $late = 0;
        $work = null;

        if ($a->time_in) {
            $in = Carbon::parse($a->time_in)->secondsSinceMidnight();

            if ($a->status === 'terlambat' && $office) {
                $start = Carbon::parse($office->jam_masuk)->secondsSinceMidnight();
                $late = max(0, intdiv($in - $start, 60));
            }
            if ($a->time_out) {
                $work = max(0, intdiv(Carbon::parse($a->time_out)->secondsSinceMidnight() - $in, 60));
            }
        }

        return array_merge($a->toArray(), ['late_minutes' => $late, 'work_minutes' => $work]);
    }
}