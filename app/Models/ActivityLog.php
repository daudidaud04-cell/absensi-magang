<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    // Log hanya dibuat, tidak pernah diubah
    public const UPDATED_AT = null;

    protected $fillable = [
        'user_id', 'user_name', 'action', 'description',
        'subject_type', 'subject_id', 'subject_label',
        'properties', 'ip_address',
    ];

    protected function casts(): array
    {
        return [
            'properties' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}