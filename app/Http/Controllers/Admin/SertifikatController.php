<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SerahTerimaSertifikat;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class SertifikatController extends Controller
{
    /**
     * Daftar peserta yang magangnya sudah selesai (alumni),
     * ditambah peserta yang sertifikatnya sudah tercatat diambil.
     */
    public function index(Request $request)
    {
        $today = today()->toDateString();

        $users = User::where('role', 'magang')
            ->with(['location:id,name', 'serahTerima'])
            ->where(fn ($q) => $q->whereDate('end_date', '<', $today)->orHas('serahTerima'))
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/sertifikat/index', [
            'pesertas' => $users->map(function ($u) {
                $st = $u->serahTerima;

                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'instansi' => $u->instansi,
                    'education_level' => $u->education_level,
                    'location' => $u->location?->name,
                    'start_date' => $u->start_date?->toDateString(),
                    'end_date' => $u->end_date?->toDateString(),
                    'serah_terima' => $st ? [
                        'diserahkan_oleh' => $st->diserahkan_nama,
                        'diambil_oleh' => $st->diambil_oleh,
                        'hubungan_pengambil' => $st->hubungan_pengambil,
                        'tanggal_diambil' => $st->tanggal_diambil?->toDateString(),
                        'catatan' => $st->catatan,
                    ] : null,
                ];
            }),
            'currentAdminName' => $request->user()->name,
        ]);
    }

    /**
     * Catat serah terima baru, atau perbarui yang sudah ada (koreksi).
     */
    public function simpan(Request $request, User $user)
    {
        abort_unless($user->role === 'magang', 404);

        $data = $request->validate([
            'diserahkan_nama' => ['required', 'string', 'max:255'],
            'hubungan_pengambil' => ['required', 'in:peserta,perwakilan'],
            'diambil_oleh' => ['nullable', 'required_if:hubungan_pengambil,perwakilan', 'string', 'max:255'],
            'tanggal_diambil' => ['required', 'date', 'before_or_equal:today'],
            'catatan' => ['nullable', 'string', 'max:500'],
        ], [
            'diserahkan_nama.required' => 'Nama petugas yang menyerahkan wajib diisi.',
            'diambil_oleh.required_if' => 'Nama pengambil wajib diisi jika diambil perwakilan.',
            'tanggal_diambil.before_or_equal' => 'Tanggal diambil tidak boleh melewati hari ini.',
        ]);

        // Kalau peserta sendiri yang mengambil, nama pengambil = nama peserta
        if ($data['hubungan_pengambil'] === 'peserta') {
            $data['diambil_oleh'] = $user->name;
        }

        DB::transaction(function () use ($user, $data) {
            SerahTerimaSertifikat::updateOrCreate(['user_id' => $user->id], $data);

            // Sinkronkan kolom lama supaya export dan halaman lain tetap konsisten
            $user->forceFill(['certificate_status' => 'sudah_diserahkan'])->save();
        });

        Log::info('SIAM: serah terima sertifikat dicatat', [
            'user_id' => $user->id,
            'diserahkan_nama' => $data['diserahkan_nama'],
            'diambil_oleh' => $data['diambil_oleh'],
            'tanggal' => $data['tanggal_diambil'],
            'oleh_admin' => $request->user()->id,
        ]);

        return back()->with('success', "Serah terima sertifikat {$user->name} berhasil dicatat.");
    }

    /**
     * Batalkan catatan serah terima (misalnya salah catat).
     */
    public function destroy(Request $request, User $user)
    {
        abort_unless($user->role === 'magang', 404);

        DB::transaction(function () use ($user) {
            SerahTerimaSertifikat::where('user_id', $user->id)->delete();
            $user->forceFill(['certificate_status' => 'belum_diberikan'])->save();
        });

        Log::info('SIAM: serah terima sertifikat dibatalkan', [
            'user_id' => $user->id,
            'oleh_admin' => $request->user()->id,
        ]);

        return back()->with('success', "Catatan serah terima {$user->name} dibatalkan.");
    }
}