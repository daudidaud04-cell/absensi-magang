<?php

namespace App\Exports;

use App\Exports\Sheets\DetailSheet;
use App\Exports\Sheets\KalenderSheet;
use App\Exports\Sheets\RekapSheet;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\Export;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class RekapBulananExport implements Export, WithMultipleSheets
{
    public function __construct(
        private Collection $users,
        private Collection $hitung,
        private Carbon $start,
        private Carbon $end,
    ) {}

    public function sheets(): array
    {
        $from = $this->start->toDateString();
        $to   = $this->end->toDateString();

        // Pengaman: pastikan detail hanya berisi tanggal pada bulan yang dipilih
        $hitung = $this->hitung->map(function ($h) use ($from, $to) {
            $h['detail'] = collect($h['detail'] ?? [])
                ->filter(function ($d) use ($from, $to) {
                    $t = Carbon::parse($d['tanggal'])->toDateString();

                    return $t >= $from && $t <= $to;
                })
                ->values()
                ->all();

            return $h;
        });

        $periode = 'Periode: ' . $this->start->copy()->locale('id')->translatedFormat('F Y');

        return [
            new RekapSheet($this->users, $hitung, $periode),
            new KalenderSheet($this->users, $hitung, $this->start, $this->end),
            new DetailSheet($this->users, $hitung),
        ];
    }
}