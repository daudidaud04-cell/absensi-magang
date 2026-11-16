<?php

namespace App\Services;

use Illuminate\Support\Facades\Auth;
use App\Models\ActivityLog;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Model;

/**
 * Pencatat log aktivitas admin.
 * Kegagalan mencatat log tidak boleh menggagalkan aksi utamanya.
 */
class ActivityLogger
{
    /**
     * @param  string  $action  kode aksi, contoh: peserta.dihapus
     * @param  string  $description  kalimat yang tampil di halaman log
     * @param  Model|null  $subject  objek yang terkena aksi
     * @param  array  $properties  data tambahan (nilai lama/baru, dll)
     */
    public static function log(string $action, string $description, ?Model $subject = null, array $properties = []): void
    {
        try {
             $admin = Auth::user();

            ActivityLog::create([
                'user_id' => $admin?->id,
                'user_name' => $admin?->name,
                'action' => $action,
                'description' => $description,
                'subject_type' => $subject ? class_basename($subject) : null,
                'subject_id' => $subject?->getKey(),
                'subject_label' => $subject?->name ?? null,
                'properties' => $properties ?: null,
                'ip_address' => request()->ip(),
            ]);
        } catch (\Throwable $e) {
            report($e);
        }
    }

    /**
     * Ambil perubahan nilai pada model. Panggil SETELAH fill() dan SEBELUM save().
     *
     * @return array<string, array{dari: mixed, menjadi: mixed}>
     */
    public static function perubahan(Model $model): array
    {
        $hasil = [];

        foreach ($model->getDirty() as $kolom => $baru) {
            if (in_array($kolom, ['updated_at', 'remember_token'], true)) {
                continue;
            }

            // Password tidak pernah dicatat nilainya
            if ($kolom === 'password') {
                $hasil[$kolom] = ['dari' => '***', 'menjadi' => 'diganti'];

                continue;
            }

            $hasil[$kolom] = [
                'dari' => self::nilai($model->getOriginal($kolom)),
                'menjadi' => self::nilai($baru),
            ];
        }

        return $hasil;
    }

    private static function nilai(mixed $v): mixed
    {
        return $v instanceof DateTimeInterface ? $v->format('Y-m-d') : $v;
    }
}