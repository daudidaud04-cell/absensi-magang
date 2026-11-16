<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string $type
 * @property Carbon $start_date
 * @property Carbon $end_date
 * @property string $reason
 * @property string|null $proof_file
 * @property string $status
 * @property int|null $reviewed_by
 * @property Carbon|null $reviewed_at
 * @property string|null $review_notes
 * @property Carbon|null $cancelled_at
 * @property int|null $cancelled_by
 * @property string|null $cancel_reason
 */
class LeaveRequest extends Model
{
    protected $fillable = [
        'user_id', 'type', 'start_date', 'end_date', 'reason', 'proof_file',
        'status', 'reviewed_by', 'reviewed_at', 'review_notes',
        'cancelled_at', 'cancelled_by', 'cancel_reason',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d',
            'reviewed_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Baris absensi izin/sakit yang dibuat saat pengajuan ini disetujui */
    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }
}