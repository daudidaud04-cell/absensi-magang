<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\LeaveRequest;
use App\Models\User;
use App\Services\ActivityLogger;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class IzinReviewController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/izin', [
            'requests' => LeaveRequest::with('user:id,name')
                ->orderByRaw("FIELD(status,'pending','approved','rejected','cancelled')")
                ->latest()->get(),
        ]);
    }

    public function update(Request $request, LeaveRequest $leaveRequest)
    {
        $data = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
            'review_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        DB::transaction(function () use ($leaveRequest, $data, $request) {
            // Kunci baris supaya tidak bentrok dengan pembatalan oleh peserta
            $lr = LeaveRequest::with('user:id,name')->lockForUpdate()->findOrFail($leaveRequest->id);

            abort_unless($lr->status === 'pending', 422, 'Pengajuan ini sudah ditinjau atau dibatalkan oleh peserta.');

            $lr->update([
                ...$data,
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
            ]);

            $dibuat = 0;
            $dilewati = 0;

            // Jika disetujui, buat baris absensi izin/sakit untuk setiap hari kerja peserta
            if ($data['status'] === 'approved') {
                $participant = User::findOrFail($lr->user_id);

                foreach (CarbonPeriod::create($lr->start_date, $lr->end_date) as $day) {
                    if (! $participant->isWorkday($day)) {
                        continue;
                    }

                    $existing = Attendance::query()
                        ->where('user_id', $lr->user_id)
                        ->whereDate('date', $day->toDateString())
                        ->first();

                    // Jangan timpa hari yang sudah hadir, atau yang milik pengajuan lain
                    if ($existing && ($existing->time_in
                        || ($existing->leave_request_id && $existing->leave_request_id !== $lr->id))) {
                        $dilewati++;

                        continue;
                    }

                    Attendance::updateOrCreate(
                        ['user_id' => $lr->user_id, 'date' => $day->toDateString()],
                        [
                            'status' => $lr->type,
                            'source' => 'manual',
                            'created_by' => $request->user()->id,
                            'admin_notes' => "Pengajuan {$lr->type} #{$lr->id} disetujui",
                            'leave_request_id' => $lr->id,
                        ]
                    );

                    $dibuat++;
                }
            }

            $nama = $lr->user?->name ?? "peserta #{$lr->user_id}";
            $disetujui = $data['status'] === 'approved';

            ActivityLogger::log(
                $disetujui ? 'izin.disetujui' : 'izin.ditolak',
                ($disetujui ? 'Menyetujui' : 'Menolak')." pengajuan {$lr->type} {$nama}",
                $lr,
                [
                    'peserta' => $nama,
                    'jenis' => $lr->type,
                    'tanggal_mulai' => $lr->start_date?->toDateString(),
                    'tanggal_selesai' => $lr->end_date?->toDateString(),
                    'alasan_pengajuan' => $lr->reason,
                    'catatan_admin' => $data['review_notes'] ?? null,
                    'ada_bukti' => (bool) $lr->proof_file,
                    'hari_dicatat' => $dibuat,
                    'hari_dilewati' => $dilewati,
                ],
            );
        });

        return back();
    }

    /** Batalkan persetujuan: hapus baris absensi izin/sakit milik pengajuan ini */
    public function batalkan(Request $request, LeaveRequest $leaveRequest)
    {
        $data = $request->validate([
            'cancel_reason' => ['required', 'string', 'min:5', 'max:1000'],
        ], [
            'cancel_reason.required' => 'Alasan pembatalan wajib diisi.',
            'cancel_reason.min' => 'Alasan pembatalan minimal 5 karakter.',
        ]);

        DB::transaction(function () use ($leaveRequest, $data, $request) {
            $lr = LeaveRequest::with('user:id,name')->lockForUpdate()->findOrFail($leaveRequest->id);

            abort_unless($lr->status === 'approved', 422, 'Hanya pengajuan yang sudah disetujui yang bisa dibatalkan.');

            // Hanya baris milik pengajuan ini, dan hanya yang belum punya jam masuk
            $dihapus = Attendance::query()
                ->where('leave_request_id', $lr->id)
                ->whereNull('time_in')
                ->delete();

            $lr->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
                'cancelled_by' => $request->user()->id,
                'cancel_reason' => $data['cancel_reason'],
            ]);

            $nama = $lr->user?->name ?? "peserta #{$lr->user_id}";

            ActivityLogger::log(
                'izin.dibatalkan',
                "Membatalkan persetujuan {$lr->type} {$nama}",
                $lr,
                [
                    'peserta' => $nama,
                    'jenis' => $lr->type,
                    'tanggal_mulai' => $lr->start_date?->toDateString(),
                    'tanggal_selesai' => $lr->end_date?->toDateString(),
                    'alasan_pembatalan' => $data['cancel_reason'],
                    'hari_dihapus' => $dihapus,
                ],
            );
        });

        return back();
    }
}