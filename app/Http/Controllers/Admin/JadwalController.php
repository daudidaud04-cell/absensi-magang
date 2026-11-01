<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use App\Models\Holiday;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class JadwalController extends Controller
{
    public function index()
    {
        $anchor = AppSetting::get('saturday_anchor', config('absensi.saturday_anchor', '2026-10-31'));

        $pesertas = User::where('role', 'magang')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'work_pattern'])
            ->map(fn ($u) => [
                'id'           => $u->id,
                'name'         => $u->name,
                'email'        => $u->email,
                // nilai lama saturday_alternate dianggap kelompok A
                'work_pattern' => match ($u->work_pattern) {
                    'saturday_alternate' => 'saturday_a',
                    null, ''             => 'weekday',
                    default              => $u->work_pattern,
                },
            ]);

        return Inertia::render('admin/jadwal', [
            'anchor'   => $anchor,
            'pesertas' => $pesertas,
            'sabtu'    => $this->pratinjauSabtu(),
        ]);
    }

    public function updateAcuan(Request $r)
    {
        $data = $r->validate(['saturday_anchor' => ['required', 'date']]);

        $tanggal = Carbon::parse($data['saturday_anchor']);

        if (! $tanggal->isSaturday()) {
            return back()->withErrors(['saturday_anchor' => 'Tanggal acuan harus hari Sabtu.']);
        }

        AppSetting::put('saturday_anchor', $tanggal->toDateString());

        return back();
    }

    public function updatePola(Request $r, User $user)
    {
        abort_unless($user->role === 'magang', 404);

        $data = $r->validate([
            'work_pattern' => ['required', 'in:weekday,saturday_a,saturday_b'],
        ]);

        $user->forceFill(['work_pattern' => $data['work_pattern']])->save();

        return back();
    }

    /** 8 Sabtu ke depan: kelompok mana yang masuk, dan apakah jatuh di hari libur */
    private function pratinjauSabtu(): array
    {
        $a = (new User)->forceFill(['work_pattern' => 'saturday_a']);
        $b = (new User)->forceFill(['work_pattern' => 'saturday_b']);

        $libur = Holiday::pluck('name', 'date')
            ->mapWithKeys(fn ($n, $d) => [Carbon::parse($d)->toDateString() => $n]);

        $d = today()->isSaturday() ? today()->copy() : today()->next(Carbon::SATURDAY);

        $hasil = [];

        for ($i = 0; $i < 8; $i++) {
            $hasil[] = [
                'tanggal' => $d->toDateString(),
                'label'   => $d->copy()->locale('id')->isoFormat('dddd, D MMMM YYYY'),
                'a'       => $a->isWorkday($d),
                'b'       => $b->isWorkday($d),
                'libur'   => $libur->get($d->toDateString()),
            ];

            $d = $d->copy()->addWeek();
        }

        return $hasil;
    }
}