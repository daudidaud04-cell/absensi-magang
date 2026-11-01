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

class DetailSheet implements FromCollection, WithHeadings, WithTitle, WithStyles, WithColumnWidths
{
    private ?array $rows = null;

    public function __construct(private Collection $users, private Collection $hitung) {}

    public function title(): string
    {
        return 'Detail';
    }

    public function headings(): array
    {
        return ['Nama', 'Tanggal', 'Hari', 'Masuk', 'Pulang', 'Status', 'Sumber', 'Jarak', 'Catatan'];
    }

    private function rows(): array
    {
        if ($this->rows !== null) {
            return $this->rows;
        }

        $this->rows = [];

        foreach ($this->users as $u) {
            foreach ($this->hitung[$u->id]['detail'] as $d) {
                $this->rows[] = ['nama' => $u->name] + $d;
            }
        }

        return $this->rows;
    }

    public function collection(): Collection
    {
        $sumber = ['self' => 'Mandiri', 'manual' => 'Manual'];

        return collect($this->rows())->map(fn ($d) => [
            $d['nama'],
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
        return ['A' => 32, 'B' => 13, 'C' => 11, 'D' => 9, 'E' => 9, 'F' => 24, 'G' => 11, 'H' => 10, 'I' => 36];
    }

    public function styles(Worksheet $sheet): array
    {
        $rows = $this->rows();
        $last = max(2, 1 + count($rows));

        Tampilan::header($sheet, 'A1:I1');
        $sheet->getRowDimension(1)->setRowHeight(30);

        if ($rows) {
            Tampilan::body($sheet, "A2:I{$last}");
            Tampilan::zebra($sheet, 'A', 'I', 2, $last);

            foreach (['B', 'C', 'D', 'E', 'G', 'H'] as $col) {
                Tampilan::center($sheet, "{$col}2:{$col}{$last}");
            }

            foreach ($rows as $i => $d) {
                Tampilan::beriWarnaStatus($sheet, 'F' . (2 + $i), $d['status']);
            }
        }

    
        $sheet->setAutoFilter("A1:I{$last}");
        Tampilan::siapCetak($sheet, 1);

        return [];
    }
}