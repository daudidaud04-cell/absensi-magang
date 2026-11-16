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
                ->orderByRaw("FIELD(status,'pending','approved','rejected')")
                ->latest()->get(),
        ]);
    }

    public function update(Request $request, LeaveRequest $leaveRequest)
    {
        abort_unless($leaveRequest->status === 'pending', 422, 'Pengajuan ini sudah ditinjau.');

        $data = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
            'review_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $leaveRequest->loadMissing('user:id,name');

        DB::transaction(function () use ($leaveRequest, $data, $request) {
            $leaveRequest->update([
                ...$data,
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
            ]);

            $hariDibuat = 0;
            $hariDilewati = 0;

            // Jika disetujui, buat baris absensi izin/sakit untuk setiap hari kerja peserta
            if ($data['status'] === 'approved') {
                $participant = User::findOrFail($leaveRequest->user_id);

                foreach (CarbonPeriod::create($leaveRequest->start_date, $leaveRequest->end_date) as $day) {
                    if (! $participant->isWorkday($day)) {
                        continue;
                    }

                    $existing = Attendance::query()
                        ->where('user_id', $leaveRequest->user_id)
                        ->whereDate('date', $day->toDateString())
                        ->first();

                    if ($existing && $existing->time_in) {
                        $hariDilewati++; // jangan timpa hari yang sudah hadir

                        continue;
                    }

                    Attendance::updateOrCreate(
                        ['user_id' => $leaveRequest->user_id, 'date' => $day->toDateString()],
                        [
                            'status' => $leaveRequest->type,
                            'source' => 'manual',
                            'created_by' => $request->user()->id,
                            'admin_notes' => "Pengajuan {$leaveRequest->type} #{$leaveRequest->id} disetujui",
                        ]
                    );

                    $hariDibuat++;
                }
            }

            $nama = $leaveRequest->user?->name ?? "peserta #{$leaveRequest->user_id}";
            $disetujui = $data['status'] === 'approved';

            ActivityLogger::log(
                $disetujui ? 'izin.disetujui' : 'izin.ditolak',
                ($disetujui ? 'Menyetujui' : 'Menolak')." pengajuan {$leaveRequest->type} {$nama}",
                $leaveRequest,
                [
                    'peserta' => $nama,
                    'jenis' => $leaveRequest->type,
                    'tanggal_mulai' => $leaveRequest->start_date?->toDateString(),
                    'tanggal_selesai' => $leaveRequest->end_date?->toDateString(),
                    'alasan_pengajuan' => $leaveRequest->reason,
                    'catatan_admin' => $data['review_notes'] ?? null,
                    'ada_bukti' => (bool) $leaveRequest->proof_file,
                    'hari_dicatat' => $hariDibuat,
                    'hari_dilewati_karena_sudah_hadir' => $hariDilewati,
                ],
            );
        });

        return back();
    }
}