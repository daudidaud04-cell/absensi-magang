<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ManualController extends Controller
{
    public function create()
    {
        return Inertia::render('admin/manual', [
            'pesertas' => User::where('role', 'magang')
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'instansi']),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id' => ['required', Rule::exists('users', 'id')->where('role', 'magang')],
            'date' => ['required', 'date'],
            'status' => ['required', 'in:hadir,terlambat,izin,sakit,alpha'],
            'time_in' => ['nullable', 'date_format:H:i'],
            'time_out' => ['nullable', 'date_format:H:i'],
            'logbook' => ['nullable', 'string', 'max:2000'],
            'admin_notes' => ['required', 'string', 'min:5', 'max:1000'],
        ], ['admin_notes.required' => 'Alasan admin wajib diisi.']);

        // Data sebelumnya (kalau tanggal ini sudah punya catatan) untuk jejak audit
        $lama = Attendance::query()
            ->where('user_id', $data['user_id'])
            ->whereDate('date', $data['date'])
            ->first();

        Attendance::updateOrCreate(
            ['user_id' => $data['user_id'], 'date' => $data['date']],
            [
                'status' => $data['status'],
                'time_in' => $data['time_in'] ?? null,
                'time_out' => $data['time_out'] ?? null,
                'logbook' => $data['logbook'] ?? null,
                'admin_notes' => $data['admin_notes'],
                'source' => 'manual',
                'created_by' => $request->user()->id,
                'leave_request_id' => null,
            ]
        );

        $peserta = User::find($data['user_id']);
        $tanggal = Carbon::parse($data['date'])->toDateString();

        ActivityLogger::log(
            $lama ? 'absen_manual.diubah' : 'absen_manual.dibuat',
            ($lama ? 'Mengubah' : 'Membuat')." absensi manual {$peserta?->name} tanggal {$tanggal} ({$data['status']})",
            $peserta,
            [
                'tanggal' => $tanggal,
                'sebelumnya' => $lama ? [
                    'status' => $lama->status,
                    'time_in' => $lama->time_in,
                    'time_out' => $lama->time_out,
                    'source' => $lama->source,
                ] : null,
                'sesudah' => [
                    'status' => $data['status'],
                    'time_in' => $data['time_in'] ?? null,
                    'time_out' => $data['time_out'] ?? null,
                ],
                'alasan' => $data['admin_notes'],
            ],
        );

        return redirect('/admin');
    }
}