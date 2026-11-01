<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Division;
use App\Models\Location;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RiwayatController extends Controller
{
    private const STATUSES = ['hadir', 'terlambat', 'izin', 'sakit', 'alpha'];

    public function index(Request $request)
    {
        $request->validate([
            'dari' => ['nullable', 'date'],
            'sampai' => ['nullable', 'date', 'after_or_equal:dari'],
            'peserta' => ['nullable', 'integer'],
            'lokasi' => ['nullable', 'integer'],
            'divisi' => ['nullable', 'integer'],
            'status' => ['nullable', 'in:'.implode(',', self::STATUSES)],
            'flag' => ['nullable', 'boolean'],
        ]);

        // Default: bulan berjalan
        $filters = [
            'dari' => $request->query('dari', today()->startOfMonth()->toDateString()),
            'sampai' => $request->query('sampai', today()->toDateString()),
            'peserta' => $request->query('peserta'),
            'lokasi' => $request->query('lokasi'),
            'divisi' => $request->query('divisi'),
            'status' => $request->query('status'),
            'flag' => $request->boolean('flag'),
        ];

        // Badge ringkasan dihitung TANPA filter status,
        // jadi angkanya tetap total walau status dipilih.
        $countsBase = Attendance::query()->filter(array_merge($filters, ['status' => null]));

        $raw = $countsBase
            ->reorder()
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $counts = collect(self::STATUSES)
            ->mapWithKeys(fn ($s) => [$s => (int) ($raw[$s] ?? 0)]);

        // Tabel: pakai filter lengkap, termasuk status
        $rows = Attendance::query()
            ->filter($filters)
            ->with(['user:id,name,email,instansi,location_id,division_id', 'user.location:id,name', 'user.division:id,name'])
            ->orderByDesc('date')
            ->orderByDesc('time_in')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (Attendance $a) => [
                'id' => $a->id,
                'date' => $a->date->format('Y-m-d'),
                'name' => $a->user?->name,
                'email' => $a->user?->email,
                'location' => $a->user?->location?->name,
                'division' => $a->user?->division?->name,
                'time_in' => $a->time_in ? substr($a->time_in, 0, 5) : null,
                'time_out' => $a->time_out ? substr($a->time_out, 0, 5) : null,
                'status' => $a->status,
                'source' => $a->source === 'manual' && ! $a->created_by ? 'sistem' : $a->source,
                'logbook' => $a->logbook,
                'is_flagged' => $a->is_flagged,
                'flag_notes' => $a->flag_notes,
            ]);

        return Inertia::render('admin/riwayat/index', [
            'rows' => $rows,
            'filters' => $filters,
            'counts' => $counts,
            'statuses' => self::STATUSES,
            'pesertas' => User::where('role', 'magang')->orderBy('name')->get(['id', 'name']),
            'locations' => Location::orderBy('name')->get(['id', 'name']),
            'divisions' => Division::orderBy('name')->get(['id', 'name', 'location_id']),
        ]);
    }
}