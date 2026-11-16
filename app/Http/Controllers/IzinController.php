<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\LeaveRequest;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class IzinController extends Controller
{
    /** Berapa hari ke belakang pengajuan masih diterima, per jenis */
    private const MAKS_MUNDUR = ['izin' => 1, 'sakit' => 3];

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

        $this->cekAturan($user, $data);

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

    /** Peserta membatalkan pengajuannya sendiri, hanya selama masih menunggu */
    public function batal(Request $request, LeaveRequest $leaveRequest)
    {
        abort_unless($leaveRequest->user_id === $request->user()->id, 403);

        // Update bersyarat: kalau admin keburu memproses, tidak ada baris yang berubah
        $berubah = LeaveRequest::query()
            ->whereKey($leaveRequest->id)
            ->where('status', 'pending')
            ->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
                'cancelled_by' => $request->user()->id,
            ]);

        if (! $berubah) {
            return back()->withErrors([
                'batal' => 'Hanya pengajuan yang masih menunggu yang bisa dibatalkan. '
                    .'Untuk pengajuan yang sudah diproses, hubungi admin.',
            ]);
        }

        return back();
    }

    /** Aturan bisnis di luar validasi bentuk data */
    private function cekAturan(User $user, array $data): void
    {
        if (! $user->start_date || ! $user->end_date) {
            $this->tolak('start_date', 'Periode magang Anda belum diatur oleh admin.');
        }

        $mulai = Carbon::parse($data['start_date'])->startOfDay();
        $selesai = Carbon::parse($data['end_date'])->startOfDay();

        // 1. Batas mundur
        $maks = self::MAKS_MUNDUR[$data['type']];
        if ($mulai->lt(today()->subDays($maks))) {
            $this->tolak('start_date', ucfirst($data['type']).' hanya dapat diajukan paling jauh '.$maks.' hari ke belakang.');
        }

        // 2. Harus di dalam periode magang
        if ($mulai->lt($user->start_date) || $selesai->gt($user->end_date)) {
            $this->tolak('start_date', 'Tanggal harus berada dalam periode magang Anda ('
                .$this->tgl($user->start_date).' s.d. '.$this->tgl($user->end_date).').');
        }

                // 3. Minimal satu hari kerja
        $adaHariKerja = false;

        foreach (CarbonPeriod::create($mulai, $selesai) as $hari) {
            if ($user->isWorkday($hari)) {
                $adaHariKerja = true;

                break;
            }
        }

        if (! $adaHariKerja) {
            $this->tolak('start_date', 'Rentang tanggal ini tidak berisi hari kerja Anda (akhir pekan atau hari libur).');
        }

        // 4. Tidak boleh bertumpuk dengan pengajuan lain yang masih aktif
        $bentrok = LeaveRequest::query()
            ->where('user_id', $user->id)
            ->whereIn('status', ['pending', 'approved'])
            ->whereDate('start_date', '<=', $selesai->toDateString())
            ->whereDate('end_date', '>=', $mulai->toDateString())
            ->first();

        if ($bentrok) {
            $status = $bentrok->status === 'pending' ? 'menunggu persetujuan' : 'disetujui';
            $this->tolak('start_date', "Tanggal ini bertumpuk dengan pengajuan {$bentrok->type} "
                .$this->tgl($bentrok->start_date).' s.d. '.$this->tgl($bentrok->end_date)." yang {$status}.");
        }

        // 5. Sudah absen, atau sudah tercatat izin/sakit
        $tercatat = Attendance::query()
            ->where('user_id', $user->id)
            ->whereBetween('date', [$mulai->toDateString(), $selesai->toDateString()])
            ->where(fn ($q) => $q->whereNotNull('time_in')->orWhereIn('status', ['izin', 'sakit']))
            ->orderBy('date')
            ->first();

        if ($tercatat) {
            $this->tolak('start_date', $tercatat->time_in
                ? 'Anda sudah absen pada '.$this->tgl($tercatat->date).', jadi tidak dapat mengajukan izin/sakit untuk tanggal tersebut.'
                : 'Tanggal '.$this->tgl($tercatat->date)." sudah tercatat {$tercatat->status}.");
        }
    }

    private function tolak(string $field, string $pesan): never
    {
        throw ValidationException::withMessages([$field => $pesan]);
    }

    private function tgl($tanggal): string
    {
        return Carbon::parse($tanggal)->locale('id')->isoFormat('D MMMM YYYY');
    }
}