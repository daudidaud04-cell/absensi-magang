<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Peserta yang belum punya catatan absen sampai jam 18:00 WIB ditandai alpha
Schedule::command('absensi:tandai-alpha')
    ->dailyAt('18:00')
    ->timezone('Asia/Jakarta')
    ->withoutOverlapping();