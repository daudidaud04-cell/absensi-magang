<?php

namespace App\Exports;

use App\Exports\Sheets\DetailSheet;
use App\Exports\Sheets\RekapSheet;
use App\Services\RekapKehadiran;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\Export;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class RekapPesertaExport implements Export, WithMultipleSheets
{
    public function __construct(private Collection $users) {}

    public function sheets(): array
    {
        $hitung = RekapKehadiran::untukPeserta($this->users);

        return [
            new RekapSheet($this->users, $hitung),
            new DetailSheet($this->users, $hitung),
        ];
    }
}