<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\User;
use Illuminate\Http\Request;
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
            ]
        );

        return redirect('/admin');
    }
}