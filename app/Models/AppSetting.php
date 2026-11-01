<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppSetting extends Model
{
    protected $fillable = ['key', 'value'];

    private static ?array $memo = null;

    public static function get(string $key, ?string $default = null): ?string
    {
        self::$memo ??= cache()->remember('app_settings', 3600, fn () => static::pluck('value', 'key')->all());

        return self::$memo[$key] ?? $default;
    }

    public static function put(string $key, ?string $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value]);

        cache()->forget('app_settings');
        self::$memo = null;
    }
}