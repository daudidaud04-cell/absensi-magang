<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SerahTerimaSertifikat extends Model
{
    protected $table = 'serah_terima_sertifikat';

    protected $fillable = [
        'user_id',
        'diserahkan_nama',
        'diambil_oleh',
        'hubungan_pengambil',
        'tanggal_diambil',
        'catatan',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_diambil' => 'date:Y-m-d',
        ];
    }

    public function peserta(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}