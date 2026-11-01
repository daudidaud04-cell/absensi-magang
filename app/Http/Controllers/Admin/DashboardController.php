<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $date = today()->toDateString();

        $aktif = User::where('role', 'magang')
            ->whereDate('start_date', '<=', $date)
            ->whereDate('end_date', '>=', $date)
            ->get(['id', 'name']);

        $rows = Attendance::with('user:id,name')->whereDate('date', $date)->get();
        $count = fn (array $s) => $rows->whereIn('status', $s)->count();

        $hadir = $count(['hadir']);
        $terlambat = $count(['terlambat']);

        return Inertia::render('admin/dashboard', [
            'date' => $date,
            'stats' => [
                'aktif' => $aktif->count(),
                'hadir' => $hadir,
                'terlambat' => $terlambat,
                'izin' => $count(['izin', 'sakit']),
                'alpha' => $count(['alpha']),
                'persen' => $aktif->count() ? round(($hadir + $terlambat) / $aktif->count() * 100) : 0,
            ],
            'rows' => $rows->map(fn ($a) => [
                'id' => $a->id,
                'name' => $a->user->name,
                'time_in' => $a->time_in,
                'time_out' => $a->time_out,
                'status' => $a->status,
                'source' => $a->source,
                'is_flagged' => $a->is_flagged,
                'has_in' => (bool) $a->image_in,
                'has_out' => (bool) $a->image_out,
                'distance_in' => $a->distance_in,
            ])->values(),
            'belum' => $aktif->whereNotIn('id', $rows->pluck('user_id'))->pluck('name')->values(),
        ]);
    }

    public function toggleFlag(Attendance $attendance)
    {
        $attendance->update(['is_flagged' => ! $attendance->is_flagged]);

        return back();
    }

    /** Ekspor CSV (bisa dibuka di Excel). */
    public function export(Request $request)
    {
        $data = $request->validate([
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after_or_equal:from'],
        ]);

        $records = Attendance::with('user:id,name,instansi')
            ->whereBetween('date', [$data['from'], $data['to']])
            ->orderBy('date')->get();

        return response()->streamDownload(function () use ($records) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF"); // BOM agar Excel membaca UTF-8
            fputcsv($out, ['Tanggal', 'Nama', 'Instansi', 'Status', 'Jam Masuk', 'Jam Pulang',
                'Jarak Masuk (m)', 'Sumber', 'Logbook', 'Catatan Admin']);
            foreach ($records as $a) {
                fputcsv($out, [$a->date->toDateString(), $a->user->name, $a->user->instansi, $a->status,
                    $a->time_in, $a->time_out, $a->distance_in, $a->source, $a->logbook, $a->admin_notes]);
            }
            fclose($out);
        }, "rekap-absensi-{$data['from']}-sd-{$data['to']}.csv", ['Content-Type' => 'text/csv']);
    }
}