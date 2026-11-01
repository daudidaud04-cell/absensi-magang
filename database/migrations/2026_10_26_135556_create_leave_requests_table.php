<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Division;
use App\Models\Location;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;

class RekapController extends Controller
{
    public function index(Request $request)
    {
        [$month, $start, $end] = $this->period($request);
        $filters = $this->filters($request);

        $next = $start->copy()->addMonth();

        return Inertia::render('admin/rekap/index', [
            'month' => $month,
            'prev' => $start->copy()->subMonth()->format('Y-m'),
            'next' => $next->lte(today()) ? $next->format('Y-m') : null,
            'filters' => $filters,
            'rows' => $this->build($start, $end, $filters)->values(),
            'locations' => Location::orderBy('name')->get(['id', 'name']),
            'divisions' => Division::orderBy('name')->get(['id', 'name', 'location_id']),
        ]);
    }

    public function export(Request $request)
    {
        [$month, $start, $end] = $this->period($request);
        $rows = $this->build($start, $end, $this->filters($request));

        return response()->streamDownload(function () use ($rows) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF"); // BOM supaya Excel membaca UTF-8

            // Titik koma agar terbuka rapi di Excel berlokal Indonesia
            fputcsv($out, ['No', 'Nama', 'Email', 'Asal', 'Lokasi', 'Divisi', 'Hari Kerja',
                'Hadir', 'Terlambat', 'Izin', 'Sakit', 'Alpha', 'Kehadiran (%)'], ';');

            foreach ($rows->values() as $i => $r) {
                fputcsv($out, [$i + 1, $r['name'], $r['email'], $r['instansi'], $r['location'], $r['division'],
                    $r['workdays'], $r['hadir'], $r['terlambat'], $r['izin'], $r['sakit'], $r['alpha'], $r['persen']], ';');
            }

            fclose($out);
        }, "rekap-absensi-{$month}.csv", ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function period(Request $request): array
    {
        $param = (string) $request->query('bulan');
        $month = preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $param) ? $param : today()->format('Y-m');
        $start = Carbon::createFromFormat('Y-m-d', $month.'-01')->startOfDay();

        return [$month, $start, $start->copy()->endOfMonth()];
    }

    private function filters(Request $request): array
    {
        return [
            'lokasi' => $request->query('lokasi') ?: null,
            'divisi' => $request->query('divisi') ?: null,
        ];
    }

    private function build(Carbon $start, Carbon $end, array $f): Collection
    {
        $from = $start->toDateString();
        $to = $end->toDateString();

        // Peserta yang masa magangnya beririsan dengan bulan ini
        $users = User::where('role', 'magang')
            ->whereDate('start_date', '<=', $to)
            ->whereDate('end_date', '>=', $from)
            ->when($f['lokasi'], fn ($q, $v) => $q->where('location_id', $v))
            ->when($f['divisi'], fn ($q, $v) => $q->where('division_id', $v))
            ->with(['location:id,name', 'division:id,name'])
            ->orderBy('name')
            ->get();

        // Ambil baris mentah; dihitung di PHP karena hari kerja tergantung pola tiap peserta
        $records = Attendance::query()
            ->whereIn('user_id', $users->pluck('id'))
            ->whereBetween('date', [$from, $to])
            ->get(['user_id', 'date', 'status'])
            ->groupBy('user_id');

        // Bulan berjalan dihitung sampai hari ini saja
        $limit = today()->lt($end) ? today() : $end->copy()->startOfDay();
        $today = today()->toDateString();

        return $users->map(function (User $u) use ($records, $start, $limit, $today) {
            // Periode hitung = irisan bulan ini, masa magang, dan batas hari ini
            $a = $u->start_date && $u->start_date->gt($start) ? $u->start_date->copy() : $start->copy();
            $b = $u->end_date && $u->end_date->lt($limit) ? $u->end_date->copy() : $limit->copy();

            // Daftar hari kerja peserta (Sabtu mengikuti work_pattern, libur dikecualikan)
            $days = [];
            if ($a->lte($b)) {
                foreach (CarbonPeriod::create($a, $b) as $d) {
                    if ($u->isWorkday($d)) {
                        $days[$d->toDateString()] = true;
                    }
                }
            }

            $c = ['hadir' => 0, 'terlambat' => 0, 'izin' => 0, 'sakit' => 0, 'alpha' => 0];
            $ada = [];

            foreach ($records->get($u->id, collect()) as $r) {
                $key = $r->date->toDateString();

                // Absensi di luar hari kerja diabaikan agar tidak melebihi pembagi
                if (isset($days[$key])) {
                    $c[$r->status]++;
                    $ada[$key] = true;
                }
            }

            // Hari kerja yang sudah lewat tanpa catatan apa pun dihitung alpha
            foreach (array_keys($days) as $date) {
                if ($date < $today && ! isset($ada[$date])) {
                    $c['alpha']++;
                }
            }

            $wd = count($days);

            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'instansi' => $u->instansi,
                'location' => $u->location?->name,
                'division' => $u->division?->name,
                'workdays' => $wd,
                'hadir' => $c['hadir'],
                'terlambat' => $c['terlambat'],
                'izin' => $c['izin'],
                'sakit' => $c['sakit'],
                'alpha' => $c['alpha'],
                'persen' => $wd > 0
                    ? min(100, (int) round(($c['hadir'] + $c['terlambat']) / $wd * 100))
                    : 0,
            ];
        });
    }
}