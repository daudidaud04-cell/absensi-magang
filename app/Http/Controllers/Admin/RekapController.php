<?php

namespace App\Http\Controllers\Admin;

use App\Exports\RekapBulananExport;
use App\Http\Controllers\Controller;
use App\Models\Division;
use App\Models\Location;
use App\Models\User;
use App\Services\RekapKehadiran;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

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

        $users  = $this->users($start, $end, $this->filters($request));
        $hitung = RekapKehadiran::untukPeserta($users, $start, $end);

        return Excel::download(
            new RekapBulananExport($users, $hitung, $start, $end),
            "rekap-absensi-{$month}.xlsx"
        );
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

    /** Peserta yang masa magangnya beririsan dengan bulan ini */
    private function users(Carbon $start, Carbon $end, array $f): Collection
    {
        $from = $start->toDateString();
        $to = $end->toDateString();

        return User::where('role', 'magang')
            ->whereDate('start_date', '<=', $to)
            ->whereDate('end_date', '>=', $from)
            ->when($f['lokasi'], fn ($q, $v) => $q->where('location_id', $v))
            ->when($f['divisi'], fn ($q, $v) => $q->where('division_id', $v))
            ->with(['location:id,name', 'division:id,name'])
            ->orderBy('name')
            ->get();
    }

    private function build(Carbon $start, Carbon $end, array $f): Collection
    {
        $users = $this->users($start, $end, $f);

        // Rumus yang sama dengan halaman Peserta dan Excel, dibatasi ke bulan ini
        $hitung = RekapKehadiran::untukPeserta($users, $start, $end);

        return $users->map(function ($u) use ($hitung) {
            $h = $hitung[$u->id];

            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'instansi' => $u->instansi,
                'location' => $u->location?->name,
                'division' => $u->division?->name,
                'workdays' => $h['hari_kerja'],
                'efektif' => $h['hari_kerja'] - $h['izin'] - $h['sakit'],
                'hadir' => $h['hadir'],
                'terlambat' => $h['terlambat'],
                'izin' => $h['izin'],
                'sakit' => $h['sakit'],
                'alpha' => $h['alpha'],
                'persen' => (int) round($h['persen'] ?? 0),
            ];
        });
    }
}