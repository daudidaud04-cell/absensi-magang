<?php

use Inertia\Inertia;
use App\Http\Middleware\EnsureWorkday;
use App\Http\Controllers\Admin;
use App\Http\Controllers\AbsensiController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\IzinController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Halaman utama
Route::get('/', fn () => redirect('/dashboard'))->name('home');

Route::middleware('auth')->group(function () {

    // Dashboard sesuai peran pengguna
    Route::get('/dashboard', fn (Request $r) => redirect(
        $r->user()->role === 'admin' ? '/admin' : '/absensi'
    ))->name('dashboard');

    // File privat: foto selfie dan bukti izin
    Route::get('/foto/{attendance}/{type}', [FileController::class, 'selfie']);
    Route::get('/berkas/izin/{leaveRequest}', [FileController::class, 'proof']);

    // Peserta magang
    Route::middleware('role:magang')->group(function () {
        Route::get('/absensi', [AbsensiController::class, 'index']);

        Route::post('/absensi/masuk', [AbsensiController::class, 'masuk'])
            ->middleware(['throttle:10,1', EnsureWorkday::class]);

        Route::post('/absensi/pulang', [AbsensiController::class, 'pulang'])
            ->middleware(['throttle:10,1', EnsureWorkday::class]);

        Route::get('/izin', [IzinController::class, 'index']);
        Route::post('/izin', [IzinController::class, 'store']);

        Route::get('/absensi/absen', [AbsensiController::class, 'form']);
        Route::get('/absensi/berhasil', [AbsensiController::class, 'berhasil']);
        Route::get('/riwayat', [AbsensiController::class, 'riwayat']);
        Route::get('/profil', fn () => Inertia::render('profil'));
    });

    // Admin
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/', [Admin\DashboardController::class, 'index']);
        Route::patch('/absensi/{attendance}/flag', [Admin\DashboardController::class, 'toggleFlag']);
        Route::get('/laporan/export', [Admin\DashboardController::class, 'export']);

        Route::get('/peserta', [Admin\PesertaController::class, 'index']);
        Route::get('/peserta/{user}/absensi', [Admin\PesertaController::class, 'absensi']);

        // Export Excel (rekap semua peserta dan laporan individu)
        Route::get('/peserta/export', [Admin\PesertaExportController::class, 'rekap']);
        Route::get('/peserta/{user}/export', [Admin\PesertaExportController::class, 'individu']);

        Route::get('/peserta/create', [Admin\PesertaController::class, 'create']);
        Route::post('/peserta', [Admin\PesertaController::class, 'store']);
        Route::get('/peserta/{user}/edit', [Admin\PesertaController::class, 'edit']);
        Route::put('/peserta/{user}', [Admin\PesertaController::class, 'update']);
        Route::patch('/peserta/{user}/sertifikat', [Admin\PesertaController::class, 'sertifikat']);

        Route::get('/lokasi', [Admin\LocationController::class, 'index']);
        Route::post('/lokasi', [Admin\LocationController::class, 'store']);
        Route::put('/lokasi/{location}', [Admin\LocationController::class, 'update']);
        Route::delete('/lokasi/{location}', [Admin\LocationController::class, 'destroy']);

        Route::get('/divisi', [Admin\DivisionController::class, 'index']);
        Route::post('/divisi', [Admin\DivisionController::class, 'store']);
        Route::put('/divisi/{division}', [Admin\DivisionController::class, 'update']);
        Route::delete('/divisi/{division}', [Admin\DivisionController::class, 'destroy']);

        Route::get('/izin', [Admin\IzinReviewController::class, 'index']);
        Route::patch('/izin/{leaveRequest}', [Admin\IzinReviewController::class, 'update']);

        Route::get('/manual', [Admin\ManualController::class, 'create']);
        Route::post('/manual', [Admin\ManualController::class, 'store']);

        Route::get('/pengaturan', [Admin\PengaturanController::class, 'index']);
        Route::put('/pengaturan/kantor', [Admin\PengaturanController::class, 'updateOffice']);
        Route::post('/pengaturan/libur', [Admin\PengaturanController::class, 'storeHoliday']);
        Route::delete('/pengaturan/libur/{holiday}', [Admin\PengaturanController::class, 'destroyHoliday']);

        Route::get('/riwayat', [Admin\RiwayatController::class, 'index']);
        Route::get('/jadwal', [Admin\JadwalController::class, 'index']);
        Route::put('/jadwal/acuan', [Admin\JadwalController::class, 'updateAcuan']);
        Route::patch('/jadwal/{user}', [Admin\JadwalController::class, 'updatePola']);

        Route::get('/rekap', [Admin\RekapController::class, 'index']);
        Route::get('/rekap/export', [Admin\RekapController::class, 'export']);
    });
});

require __DIR__.'/settings.php';