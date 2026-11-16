<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'aksi' => ['nullable', 'string', 'max:60'],
            'admin' => ['nullable', 'integer'],
            'dari' => ['nullable', 'date'],
            'sampai' => ['nullable', 'date'],
        ]);

        $logs = ActivityLog::query()
            ->when($filters['q'] ?? null, function ($q, $key) {
                $q->where(fn ($w) => $w
                    ->where('description', 'like', "%{$key}%")
                    ->orWhere('subject_label', 'like', "%{$key}%")
                    ->orWhere('user_name', 'like', "%{$key}%"));
            })
            ->when($filters['aksi'] ?? null, fn ($q, $v) => $q->where('action', 'like', $v.'%'))
            ->when($filters['admin'] ?? null, fn ($q, $v) => $q->where('user_id', $v))
            ->when($filters['dari'] ?? null, fn ($q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($filters['sampai'] ?? null, fn ($q, $v) => $q->whereDate('created_at', '<=', $v))
            ->latest('created_at')
            ->latest('id')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (ActivityLog $l) => [
                'id' => $l->id,
                'waktu' => $l->created_at->format('Y-m-d H:i:s'),
                'admin' => $l->user_name ?? '–',
                'action' => $l->action,
                'description' => $l->description,
                'subject_label' => $l->subject_label,
                'properties' => $l->properties,
                'ip' => $l->ip_address,
            ]);

        return Inertia::render('admin/log', [
            'logs' => $logs,
            'filters' => [
                'q' => $filters['q'] ?? '',
                'aksi' => $filters['aksi'] ?? '',
                'admin' => $filters['admin'] ?? '',
                'dari' => $filters['dari'] ?? '',
                'sampai' => $filters['sampai'] ?? '',
            ],
            // Dropdown filter admin: hanya admin yang pernah punya log
            'admins' => ActivityLog::query()
                ->whereNotNull('user_id')
                ->select('user_id', 'user_name')
                ->distinct()
                ->orderBy('user_name')
                ->get()
                ->map(fn ($a) => ['id' => $a->user_id, 'name' => $a->user_name]),
            // Kelompok aksi (awalan sebelum titik)
            'kelompok' => [
                ['peserta', 'Peserta'],
                ['izin', 'Izin / Sakit'],
                ['absen_manual', 'Absen manual'],
                ['sertifikat', 'Sertifikat'],
                ['jadwal', 'Jadwal kerja'],
                ['lokasi', 'Lokasi'],
            ],
        ]);
    }
}