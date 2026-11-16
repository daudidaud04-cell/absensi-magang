<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Holiday;
use App\Models\User;
use App\Services\ActivityLogger;
use Carbon\CarbonPeriod;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ManualController extends Controller
{
    private const MAKS_HARI = 31;

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
            'date' => ['required', 'date_format:Y-m-d'],
            'date_end' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date'],
            'status' => ['required', 'in:hadir,terlambat,izin,sakit,alpha'],
            'time_in' => ['nullable', 'required_if:status,hadir,terlambat', 'prohibited_if:status,izin,sakit,alpha', 'date_format:H:i'],
            'time_out' => ['nullable', 'prohibited_if:status,izin,sakit,alpha', 'date_format:H:i', 'after_or_equal:time_in'],
            'logbook' => ['nullable', 'string', 'max:2000'],
            'admin_notes' => ['required', 'string', 'min:5', 'max:1000'],
        ], [
            'user_id.required' => 'Peserta wajib dipilih.',
            'user_id.exists' => 'Peserta tidak ditemukan.',
            'date.required' => 'Tanggal wajib diisi.',
            'date_end.after_or_equal' => 'Tanggal akhir tidak boleh sebelum tanggal mulai.',
            'time_in.required_if' => 'Jam masuk wajib diisi untuk status hadir atau terlambat.',
            'time_in.prohibited_if' => 'Jam masuk harus dikosongkan untuk izin, sakit, atau alpha.',
            'time_out.prohibited_if' => 'Jam pulang harus dikosongkan untuk izin, sakit, atau alpha.',
            'time_out.after_or_equal' => 'Jam pulang tidak boleh lebih awal dari jam masuk.',
            'admin_notes.required' => 'Alasan admin wajib diisi.',
            'admin_notes.min' => 'Alasan admin minimal 5 karakter.',
        ]);

        $start = Carbon::createFromFormat('Y-m-d', $data['date'])->startOfDay();
        $end = ! empty($data['date_end'])
            ? Carbon::createFromFormat('Y-m-d', $data['date_end'])->startOfDay()
            : $start->copy();
        $isRange = $end->gt($start);

        if (abs((int) $start->diffInDays($end)) + 1 > self::MAKS_HARI) {
            throw ValidationException::withMessages([
                'date_end' => 'Rentang tanggal maksimal '.self::MAKS_HARI.' hari.',
            ]);
        }

        if (in_array($data['status'], ['hadir', 'terlambat'], true) && $end->isFuture()) {
            throw ValidationException::withMessages([
                $isRange ? 'date_end' : 'date' => 'Status hadir/terlambat tidak boleh untuk tanggal yang belum terjadi.',
            ]);
        }

        $adminId = $request->user()->id;
        $peserta = User::findOrFail($data['user_id']);
        $holidays = $isRange ? Holiday::dates() : [];

        $payload = [
            'status' => $data['status'],
            'time_in' => $data['time_in'] ?? null,
            'time_out' => $data['time_out'] ?? null,
            'logbook' => $data['logbook'] ?? null,
            'admin_notes' => $data['admin_notes'],
            'source' => 'manual',
        ];

        try {
            $hasil = DB::transaction(function () use ($data, $start, $end, $isRange, $adminId, $holidays, $payload, $peserta) {
                $existing = Attendance::where('user_id', $data['user_id'])
                    ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
                    ->lockForUpdate()
                    ->get()
                    ->keyBy(fn ($a) => $a->date->toDateString());

                $dibuat = [];
                $diubah = []; // tanggal => data sebelumnya (hanya untuk satu hari)
                $bukanKerja = 0;
                $libur = [];
                $sudahAda = [];

                foreach (CarbonPeriod::create($start, $end) as $day) {
                    $key = $day->toDateString();

                    // Aturan lewati hanya berlaku untuk rentang. Satu hari = keputusan eksplisit admin.
                    if ($isRange) {
                        if (in_array($key, $holidays, true)) {
                            $libur[] = $key;

                            continue;
                        }
                        if (! $peserta->isWorkday($day)) {
                            $bukanKerja++;

                            continue;
                        }
                    }

                    $lama = $existing->get($key);

                    // Rentang tidak pernah menimpa record yang sudah ada
                    if ($lama && $isRange) {
                        $sudahAda[] = $key;

                        continue;
                    }

                    if ($lama) {
                        $diubah[$key] = [
                            'status' => $lama->status,
                            'time_in' => $lama->time_in,
                            'time_out' => $lama->time_out,
                            'source' => $lama->source,
                        ];

                        $lama->update($payload + [
                            'updated_by' => $adminId,
                            'leave_request_id' => null,
                        ]);
                    } else {
                        Attendance::create($payload + [
                            'user_id' => $data['user_id'],
                            'date' => $key,
                            'created_by' => $adminId,
                        ]);
                        $dibuat[] = $key;
                    }
                }

                return compact('dibuat', 'diubah', 'bukanKerja', 'libur', 'sudahAda');
            });
        } catch (QueryException $e) {
            // Contoh: dua admin menyimpan tanggal yang sama bersamaan (unique user_id + date)
            report($e);
            $this->toast('error', 'Gagal menyimpan: data absensi berubah saat diproses. Silakan coba lagi.');

            return back();
        }

        ['dibuat' => $dibuat, 'diubah' => $diubah, 'bukanKerja' => $bukanKerja, 'libur' => $libur, 'sudahAda' => $sudahAda] = $hasil;

        $fmt = fn (string $tgl) => Carbon::parse($tgl)->locale('id')->translatedFormat('j M Y');
        $nama = $peserta->name;

        // Jejak audit
        if ($isRange) {
            ActivityLogger::log(
                'absen_manual.rentang',
                "Membuat absensi manual {$nama} tanggal {$start->toDateString()} s/d {$end->toDateString()} ({$data['status']}), ".count($dibuat).' hari dibuat',
                $peserta,
                [
                    'dari' => $start->toDateString(),
                    'sampai' => $end->toDateString(),
                    'status' => $data['status'],
                    'dibuat' => $dibuat,
                    'dilewati' => [
                        'bukan_hari_kerja' => $bukanKerja,
                        'libur' => $libur,
                        'sudah_ada' => $sudahAda,
                    ],
                    'alasan' => $data['admin_notes'],
                ],
            );
        } else {
            $tanggal = $start->toDateString();
            $sebelumnya = $diubah[$tanggal] ?? null;

            ActivityLogger::log(
                $sebelumnya ? 'absen_manual.diubah' : 'absen_manual.dibuat',
                ($sebelumnya ? 'Mengubah' : 'Membuat')." absensi manual {$nama} tanggal {$tanggal} ({$data['status']})",
                $peserta,
                [
                    'tanggal' => $tanggal,
                    'sebelumnya' => $sebelumnya,
                    'sesudah' => [
                        'status' => $data['status'],
                        'time_in' => $payload['time_in'],
                        'time_out' => $payload['time_out'],
                    ],
                    'alasan' => $data['admin_notes'],
                ],
            );
        }

        // Pesan untuk admin (toast)
        if (! $isRange) {
            $this->toast('success', "Absensi {$nama} tanggal {$fmt($start->toDateString())}".($diubah ? ' diperbarui.' : ' disimpan.'));

            return back();
        }

        $pesan = count($dibuat) > 0
            ? 'Berhasil membuat '.count($dibuat)." absensi {$nama} ({$fmt($start->toDateString())} – {$fmt($end->toDateString())})."
            : 'Tidak ada absensi baru yang dibuat.';

        if ($bukanKerja > 0) {
            $pesan .= " Dilewati {$bukanKerja} hari non-kerja.";
        }
        if ($libur) {
            $pesan .= ' Hari libur dilewati: '.implode(', ', array_map($fmt, $libur)).'.';
        }
        if ($sudahAda) {
            $pesan .= ' Sudah ada absen (tidak ditimpa): '.implode(', ', array_map($fmt, $sudahAda)).'.';
        }

        $this->toast(count($dibuat) > 0 ? 'success' : 'error', $pesan);

        return back();
    }

    /** Toast lewat mekanisme flash Inertia yang sudah dipakai useFlashToast */
    private function toast(string $type, string $message): void
    {
        Inertia::flash('toast', ['type' => $type, 'message' => $message]);
    }
}