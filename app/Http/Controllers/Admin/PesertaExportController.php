<?php

namespace App\Http\Controllers\Admin;

use App\Exports\LaporanIndividuExport;
use App\Exports\RekapPesertaExport;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class PesertaExportController extends Controller
{
    public function rekap(Request $r)
    {
        return Excel::download(
            new RekapPesertaExport($this->peserta($r)),
            'rekap-peserta-' . today()->format('Y-m-d') . '.xlsx'
        );
    }

    public function individu(User $user)
    {
        abort_unless($user->role === 'magang', 404);

        return Excel::download(
            new LaporanIndividuExport($user),
            'laporan-' . str($user->name)->slug() . '-' . today()->format('Y-m-d') . '.xlsx'
        );
    }

    private function peserta(Request $r)
    {
        $status = $r->query('status', 'aktif');   // aktif | alumni | semua
        $level  = $r->query('level', 'semua');    // semua | smk | perguruan_tinggi
        $q      = trim((string) $r->query('q', ''));

        return User::where('role', 'magang')
            ->with('location:id,name')
            ->when($level === 'smk', fn ($x) => $x->whereRaw('LOWER(education_level) IN (?, ?)', ['smk', 'sma']))
            ->when($level === 'perguruan_tinggi', fn ($x) => $x->where(fn ($w) => $w
                ->whereNull('education_level')
                ->orWhereRaw('LOWER(education_level) NOT IN (?, ?)', ['smk', 'sma'])))
            ->when($q !== '', fn ($x) => $x->where(fn ($w) => $w
                ->where('name', 'like', "%{$q}%")
                ->orWhere('email', 'like', "%{$q}%")
                ->orWhere('instansi', 'like', "%{$q}%")))
            ->orderBy('name')
            ->get()
            // status_magang adalah accessor, jadi disaring setelah data diambil
            ->when($status !== 'semua', fn ($c) => $c->filter(fn ($u) => $u->status_magang === $status))
            ->values();
    }
}