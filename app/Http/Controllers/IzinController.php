<?php

namespace App\Http\Controllers;

use App\Models\LeaveRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class IzinController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('izin/index', [
            'requests' => LeaveRequest::where('user_id', $request->user()->id)->latest()->get(),
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        abort_if($user->status_magang === 'alumni', 403, 'Masa magang telah berakhir.');

        $data = $request->validate([
            'type' => ['required', 'in:izin,sakit'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'reason' => ['required', 'string', 'max:1000'],
            'proof_file' => ['required_if:type,sakit', 'nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:2048'],
        ], ['proof_file.required_if' => 'Bukti (surat dokter) wajib dilampirkan untuk sakit.']);

        LeaveRequest::create([
            'user_id' => $user->id,
            'type' => $data['type'],
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'reason' => $data['reason'],
            'proof_file' => $request->file('proof_file')?->store("proofs/{$user->id}", 'local'),
        ]);

        return redirect('/izin');
    }
}