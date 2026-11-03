<?php

namespace App\Console\Commands;

use App\Http\Controllers\Admin\PesertaController;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use ReflectionMethod;

class ImportPeserta extends Command
{
    protected $signature = 'peserta:import {file} {--dry-run}';
    protected $description = 'Impor peserta magang dari CSV (semua atau tidak sama sekali)';

    public function handle(): int
    {
        $path = $this->argument('file');
        if (! is_file($path)) {
            $this->error("File tidak ditemukan: $path");
            return self::FAILURE;
        }

        $fh = fopen($path, 'r');
        $header = fgetcsv($fh);
        if (! $header) {
            $this->error('File kosong atau header tidak terbaca');
            return self::FAILURE;
        }
        $header = array_map('trim', $header);
        $header[0] = ltrim($header[0], "\xEF\xBB\xBF"); // buang BOM Excel

        $controller = app(PesertaController::class);
        $rulesMethod = new ReflectionMethod($controller, 'profileRules');
        $rulesMethod->setAccessible(true);
        $msgMethod = new ReflectionMethod($controller, 'pesanValidasi');
        $msgMethod->setAccessible(true);

        $dry = $this->option('dry-run');
        $ok = 0;
        $fail = 0;
        $out = [];
        $seen = [];
        $line = 1;

        DB::beginTransaction();

        try {
            while (($row = fgetcsv($fh)) !== false) {
                $line++;
                if ($row === [null]) {
                    continue; // baris kosong
                }
                if (count($row) !== count($header)) {
                    $this->error("Baris $line: jumlah kolom tidak sesuai header");
                    $fail++;
                    continue;
                }

                $data = array_combine($header, array_map('trim', $row));
                $data = array_map(fn ($v) => $v === '' ? null : $v, $data);
                $password = Str::random(12);
                $data['password'] = $password;

                // profileRules() membaca request('location_id'), jadi isi dulu
                request()->merge($data);

                $v = Validator::make($data, [
                    'name' => ['required', 'string', 'max:255'],
                    'email' => ['required', 'email', 'unique:users,email'],
                    'password' => ['required', 'string', 'min:8'],
                    // false = tanggal selesai lampau boleh (khusus impor)
                    ...$rulesMethod->invoke($controller, false),
                ], $msgMethod->invoke($controller));

                if ($v->fails()) {
                    $fail++;
                    $this->error("Baris $line ({$data['email']}): ".$v->errors()->first());
                    continue;
                }

                // Cek email ganda di dalam CSV
                $emailKey = strtolower($data['email']);
                if (isset($seen[$emailKey])) {
                    $fail++;
                    $this->error("Baris $line ({$data['email']}): email sama dengan baris {$seen[$emailKey]}");
                    continue;
                }
                $seen[$emailKey] = $line;

                // Simpan SELALU dijalankan (di dry-run akan di-rollback)
                $user = new User($v->validated());
                $user->forceFill([
                    'role' => 'magang',
                    'email_verified_at' => now(),
                    'certificate_status' => 'belum_diberikan',
                ])->save();

                $ok++;
                $out[] = [$data['name'], $data['email'], $password];
            }
            fclose($fh);

            if ($dry || $fail > 0) {
                DB::rollBack();
            } else {
                DB::commit();
            }
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->error("Error di baris $line: ".$e->getMessage());
            $this->error('Semua perubahan dibatalkan (rollback).');
            return self::FAILURE;
        }

        if ($fail > 0) {
            $this->error("Ada $fail baris gagal. TIDAK ADA data yang disimpan. Perbaiki CSV lalu ulangi.");
            return self::FAILURE;
        }

        if ($dry) {
            $this->info("[DRY RUN] Valid: $ok, gagal: 0. Tidak ada data yang disimpan.");
            return self::SUCCESS;
        }

        $this->table(['Nama', 'Email', 'Password sementara'], $out);
        $this->info("Berhasil menyimpan $ok peserta.");

        // File password ditulis di folder yang sama dengan CSV
        $file = dirname($path).DIRECTORY_SEPARATOR.'password-peserta-'.date('Ymd-His').'.csv';
        $f = fopen($file, 'w');
        fputcsv($f, ['Nama', 'Email', 'Password sementara']);
        foreach ($out as $o) {
            fputcsv($f, $o);
        }
        fclose($f);
        @chmod($file, 0600);
        $this->warn("Password disimpan di: $file (hapus setelah dibagikan)");

        return self::SUCCESS;
    }
}