<?php

namespace App\Console\Commands;

use App\Models\Attendance;
use App\Models\User;
use App\Services\AttendanceService;
use Illuminate\Console\Command;

class MarkAbsentees extends Command
{
    protected $signature = 'absensi:tandai-alpha';
    protected $description = 'Tandai peserta aktif yang tidak absen hari ini sebagai alpha';

    public function handle(AttendanceService $svc): int
    {
        $now = now();
        if (! $svc->isWorkday($now)) {
            $this->info('Bukan hari kerja, dilewati.');

            return self::SUCCESS;
        }

        $date = $now->toDateString();
        $count = 0;

        $users = User::where('role', 'magang')
            ->whereDate('start_date', '<=', $date)
            ->whereDate('end_date', '>=', $date)->get();

        foreach ($users as $user) {
            $row = Attendance::firstOrCreate(
                ['user_id' => $user->id, 'date' => $date],
                ['status' => 'alpha', 'source' => 'manual', 'admin_notes' => 'Ditandai alpha otomatis oleh sistem']
            );
            $count += $row->wasRecentlyCreated ? 1 : 0;
        }

        $this->info("{$count} peserta ditandai alpha.");

        return self::SUCCESS;
    }
}   