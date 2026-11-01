<?php

namespace App\Models;
use App\Models\Concerns\HasWorkSchedule;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string $role
 * @property string $education_level
 * @property string|null $nim_nis
 * @property string|null $phone
 * @property string|null $guardian_phone
 * @property string|null $instansi
 * @property string|null $major
 * @property string|null $divisi
 * @property int|null $location_id
 * @property string|null $pembimbing
 * @property string|null $school_supervisor
 * @property Carbon|null $start_date
 * @property Carbon|null $end_date
 * @property string|null $letter_number
 * @property string $certificate_status
 * @property string|null $certificate_number
 * @property Carbon|null $certificate_date
 * @property string $status_magang
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'name',
    'email',
    'password',
    'nim_nis',
    'phone',
    'instansi',
    'pembimbing',
    'start_date',
    'end_date',
    'education_level',
    'major',
    'location_id',
    'division_id',
    'school_supervisor',
    'guardian_phone',
    'letter_number',
    'certificate_number',
    'certificate_date',
])]
#[Hidden([
    'password',
    'two_factor_secret',
    'two_factor_recovery_codes',
    'remember_token',
])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasWorkSchedule;

    protected $appends = ['status_magang'];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'start_date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d',
            'certificate_date' => 'date:Y-m-d',
        ];
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function division(): BelongsTo
{
    return $this->belongsTo(Division::class);
}

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function getStatusMagangAttribute(): string
    {
        if ($this->role !== 'magang') {
            return 'aktif';
        }

        $today = today();

        if ($this->start_date && $today->lt($this->start_date)) {
            return 'belum_mulai';
        }

        if ($this->end_date && $today->gt($this->end_date)) {
            return 'alumni';
        }

        return 'aktif';
    }
}