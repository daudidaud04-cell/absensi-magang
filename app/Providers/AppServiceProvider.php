<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Closure;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        // Aturan kata sandi: minimal 8 karakter, diawali huruf besar,
        // dan mengandung minimal 1 simbol (misalnya # ! *).
        Password::defaults(fn (): Password => Password::min(8)->rules([
            function (string $attribute, mixed $value, Closure $fail): void {
                if (! preg_match('/^\p{Lu}/u', (string) $value)) {
                    $fail('Kata sandi harus diawali huruf besar.');
                }
            },
            function (string $attribute, mixed $value, Closure $fail): void {
                if (! preg_match('/[^\p{L}\p{N}\s]/u', (string) $value)) {
                    $fail('Kata sandi harus mengandung minimal 1 simbol, misalnya # ! atau *.');
                }
            },
        ]));
    }
}