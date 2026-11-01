<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\LeaveRequest;
use App\Services\AttendanceService;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
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

    public function update(Request $request, LeaveRequest $leaveRequest, AttendanceService $svc)
    {
        abort_unless($leaveRequest->status === 'pending', 422, 'Pengajuan ini sudah ditinjau.');

        $data = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
            'review_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $leaveRequest->update([
            ...$data,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        // Jika disetujui, buat baris absensi izin/sakit untuk setiap hari kerja
        if ($data['status'] === 'approved') {
            foreach (CarbonPeriod::create($leaveRequest->start_date, $leaveRequest->end_date) as $day) {
                if (! $svc->isWorkday($day)) {
                    continue;
                }
                $existing = Attendance::query()
                    ->where('user_id', $leaveRequest->user_id)
                    ->whereDate('date', $day->toDateString())
                    ->first();
                if ($existing && $existing->time_in) {
                    continue; // jangan timpa hari yang sudah hadir
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
            }
        }

        return back();
    }
}