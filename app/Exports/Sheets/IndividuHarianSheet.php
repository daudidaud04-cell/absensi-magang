<?php

namespace App\Exports\Sheets;

use App\Exports\Support\Tampilan;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class IndividuHarianSheet implements FromCollection, WithHeadings, WithTitle, WithStyles, WithColumnWidths
{
    public function __construct(private array $detail) {}

    public function title(): string
    {
        return 'Harian';
    }

    public function headings(): array
    {
        return ['Tanggal', 'Hari', 'Masuk', 'Pulang', 'Status', 'Sumber', 'Jarak', 'Catatan'];
    }

    public function collection(): Collection
    {
        $sumber = ['self' => 'Mandiri', 'manual' => 'Manual'];

        return collect($this->detail)->map(fn ($d) => [
            Carbon::parse($d['tanggal'])->format('d/m/Y'),
            ucfirst($d['hari']),
            $d['masuk'] ?: '-',
            $d['pulang'] ?: '-',
            ucfirst($d['status']),
            $sumber[$d['sumber']] ?? ($d['sumber'] ?: '-'),
            $d['jarak'] ?: '-',
            $d['catatan'] ?: '',
        ]);
    }

    public function columnWidths(): array
    {
        return ['A' => 13, 'B' => 11, 'C' => 9, 'D' => 9, 'E' => 24, 'F' => 11, 'G' => 10, 'H' => 36];
    }

    public function styles(Worksheet $sheet): array
    {
        $last = max(2, 1 + count($this->detail));

        Tampilan::header($sheet, 'A1:H1');
        $sheet->getRowDimension(1)->setRowHeight(30);

        if ($this->detail) {
            Tampilan::body($sheet, "A2:H{$last}");
            Tampilan::zebra($sheet, 'A', 'H', 2, $last);

            foreach (['A', 'B', 'C', 'D', 'F', 'G'] as $col) {
                Tampilan::center($sheet, "{$col}2:{$col}{$last}");
            }

            foreach ($this->detail as $i => $d) {
                Tampilan::beriWarnaStatus($sheet, 'E' . (2 + $i), $d['status']);
            }
        }

       
        Tampilan::siapCetak($sheet, 1);

        return [];
    }
}