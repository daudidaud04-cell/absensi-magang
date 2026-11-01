<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

class Holiday extends Model
{
    protected $fillable = ['date', 'name'];

    public static function dates(): array
    {
        return cache()->remember('holiday_dates', 3600, fn () =>
            static::pluck('date')->map(fn ($d) => Carbon::parse($d)->toDateString())->all()
        );
    }

    protected static function booted(): void
    {
        static::saved(fn () => cache()->forget('holiday_dates'));
        static::deleted(fn () => cache()->forget('holiday_dates'));
    }
}