<?php

namespace App\Exports;

use App\Exports\Sheets\IndividuHarianSheet;
use App\Exports\Sheets\IndividuRingkasanSheet;
use App\Models\Attendance;
use App\Models\User;
use App\Services\RekapKehadiran;
use Maatwebsite\Excel\Concerns\Export;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class LaporanIndividuExport implements Export, WithMultipleSheets
{
    public function __construct(private User $user) {}

    public function sheets(): array
    {
        $u = $this->user->loadMissing('division:id,name');
        $h = RekapKehadiran::hitung($u, Attendance::where('user_id', $u->id)->get());

        return [
            new IndividuRingkasanSheet($u, $h),
            new IndividuHarianSheet($h['detail']),
        ];
    }
}