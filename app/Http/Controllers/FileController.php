<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\LeaveRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class FileController extends Controller
{
    public function selfie(Request $request, Attendance $attendance, string $type): BinaryFileResponse
    {
        $user = $request->user();
        abort_unless($user->role === 'admin' || $attendance->user_id === $user->id, 403);
        abort_unless(in_array($type, ['in', 'out'], true), 404);

        $path = $type === 'in' ? $attendance->image_in : $attendance->image_out;
        abort_unless($path && Storage::disk('local')->exists($path), 404);

        return response()->file(Storage::disk('local')->path($path));
    }

    public function proof(Request $request, LeaveRequest $leaveRequest): BinaryFileResponse
    {
        $user = $request->user();
        abort_unless($user->role === 'admin' || $leaveRequest->user_id === $user->id, 403);
        abort_unless($leaveRequest->proof_file && Storage::disk('local')->exists($leaveRequest->proof_file), 404);

        return response()->file(Storage::disk('local')->path($leaveRequest->proof_file));
    }
}