<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Division;
use App\Models\Location;
use App\Models\User;
use App\Services\RekapKehadiran;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PesertaController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->query('status', 'aktif');
        $level = $request->query('level', 'semua');
        $today = today()->toDateString();

        $query = User::where('role', 'magang')->orderBy('name')
            ->with(['location:id,name', 'division:id,name']);

        if ($status === 'aktif') {
            $query->where(fn ($q) => $q->whereNull('end_date')->orWhereDate('end_date', '>=', $today));
        } elseif ($status === 'alumni') {
            $query->whereDate('end_date', '<', $today);
        }

        if (in_array($level, ['smk', 'perguruan_tinggi'], true)) {
            $query->where('education_level', $level);
        }

        $users = $query->get();
        $rekap = RekapKehadiran::untukPeserta($users); // rumus yang sama dengan Excel

        return Inertia::render('admin/peserta/index', [
            'status' => $status,
            'level' => $level,
            'pesertas' => $users->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'instansi' => $u->instansi,
                'education_level' => $u->education_level,
                'location' => $u->location?->name,
                'division' => $u->division?->name,
                'start_date' => $u->start_date?->toDateString(),
                'end_date' => $u->end_date?->toDateString(),
                'status_magang' => $u->status_magang,
                'certificate_status' => $u->certificate_status,
                'persen' => $rekap[$u->id]['persen'],
            ]),
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/peserta/form', [
            'peserta' => null,
            'locations' => $this->locationOptions(),
            'divisions' => $this->divisionOptions(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            ...$this->profileRules(true),
        ], $this->pesanValidasi());

        $user = new User($data);
        $user->forceFill([
            'role' => 'magang',
            'email_verified_at' => now(),
            'certificate_status' => 'belum_diberikan',
        ])->save();

        return redirect('/admin/peserta');
    }

    public function edit(User $user)
    {
        abort_unless($user->role === 'magang', 404);

        return Inertia::render('admin/peserta/form', [
            'peserta' => [
                ...$user->only([
                    'id', 'name', 'email', 'nim_nis', 'phone', 'instansi', 'pembimbing',
                    'education_level', 'major', 'location_id', 'division_id',
                    'school_supervisor', 'guardian_phone', 'letter_number',
                    'certificate_number',
                ]),
                'start_date' => $user->start_date?->format('Y-m-d'),
                'end_date' => $user->end_date?->format('Y-m-d'),
                'certificate_date' => $user->certificate_date?->format('Y-m-d'),
            ],
            'locations' => $this->locationOptions($user->location_id),
            'divisions' => $this->divisionOptions($user->division_id),
        ]);
    }

    public function update(Request $request, User $user)
    {
        abort_unless($user->role === 'magang', 404);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8'],
            ...$this->profileRules(),
        ], $this->pesanValidasi());

        if (empty($data['password'])) {
            unset($data['password']);
        }

        // Jejak audit perpanjangan/perubahan periode magang
        if ($user->end_date?->toDateString() !== $data['end_date']) {
            Log::info('SIAM: end_date diubah', [
                'user_id' => $user->id,
                'dari' => $user->end_date?->toDateString(),
                'menjadi' => $data['end_date'],
                'oleh_admin' => $request->user()->id,
            ]);
        }

        $user->update($data);

        return redirect('/admin/peserta');
    }

    public function sertifikat(Request $request, User $user)
    {
        abort_unless($user->role === 'magang', 404);
        $data = $request->validate([
            'certificate_status' => ['required', 'in:belum_diberikan,siap_diambil,sudah_diserahkan'],
        ]);
        $user->forceFill($data)->save();

        return back();
    }

    /**
     * Detail kehadiran satu peserta (dipakai modal di halaman Peserta).
     * Memakai RekapKehadiran supaya angkanya sama dengan tabel dan Excel.
     */
    public function absensi(User $user)
    {
        abort_unless($user->role === 'magang', 404);

        $h = RekapKehadiran::hitung(
            $user,
            $user->attendances()->whereDate('date', '<=', today())->get()
        );

        return response()->json([
            'nama' => $user->name,
            'ringkasan' => collect($h)->except('detail'),
            'detail' => collect($h['detail'])
                ->map(fn ($d) => $d + [
                    'jenis' => explode(' ', $d['status'])[0],
                    'bulan' => substr($d['tanggal'], 0, 7),
                ])
                ->values(),
        ]);
    }

    /**
     * Lokasi aktif untuk dropdown. Yang sedang dipakai peserta
     * tetap tampil walau sudah dinonaktifkan.
     */
    private function locationOptions(?int $currentId = null)
    {
        return Location::where(fn ($q) => $q->where('is_active', true)
            ->when($currentId, fn ($q) => $q->orWhere('id', $currentId)))
            ->orderBy('name')
            ->get(['id', 'name']);
    }

    private function divisionOptions(?int $currentId = null)
    {
        return Division::where(fn ($q) => $q->where('is_active', true)
            ->when($currentId, fn ($q) => $q->orWhere('id', $currentId)))
            ->orderBy('name')
            ->get(['id', 'name', 'location_id']);
    }

    /**
     * @param  bool  $baru  true saat tambah peserta baru: tanggal selesai tidak boleh sudah lewat.
     *                      Saat edit tetap false supaya data alumni lama masih bisa diedit.
     */
    private function profileRules(bool $baru = false): array
    {
        return [
            'education_level' => ['required', 'in:smk,perguruan_tinggi'],
            'nim_nis' => ['nullable', 'string', 'max:50'],
            'phone' => ['nullable', 'string', 'max:20'],
            'guardian_phone' => ['nullable', 'string', 'max:20'],
            'instansi' => ['nullable', 'string', 'max:255'],
            'major' => ['nullable', 'string', 'max:255'],
            'location_id' => ['nullable', 'exists:locations,id'],
            'division_id' => [
                'nullable',
                Rule::exists('divisions', 'id')->where('location_id', request('location_id')),
            ],
            'pembimbing' => ['nullable', 'string', 'max:255'],
            'school_supervisor' => ['nullable', 'string', 'max:255'],
            'letter_number' => ['nullable', 'string', 'max:100'],
            'certificate_number' => ['nullable', 'string', 'max:100'],
            'certificate_date' => ['nullable', 'date'],
            'start_date' => ['required', 'date'],
            'end_date' => array_merge(
                ['required', 'date', 'after_or_equal:start_date'],
                $baru ? ['after_or_equal:today'] : []
            ),
        ];
    }

    private function pesanValidasi(): array
    {
        return [
            'end_date.after_or_equal' => 'Tanggal selesai tidak boleh sebelum tanggal mulai atau sebelum hari ini.',
        ];
    }
}