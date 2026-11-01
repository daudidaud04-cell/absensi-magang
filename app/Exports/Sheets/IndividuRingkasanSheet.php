<?php

namespace App\Exports\Sheets;

use App\Exports\Support\Tampilan;
use App\Models\User;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\WithStrictNullComparison;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithCustomStartCell;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class IndividuRingkasanSheet implements FromCollection, WithTitle, WithStyles, WithColumnWidths, WithCustomStartCell, WithStrictNullComparison
{
    public function __construct(private User $u, private array $h) {}

    public function title(): string
    {
        return 'Ringkasan';
    }

    public function startCell(): string
    {
        return 'A4';
    }

    public function collection(): Collection
    {
        $u   = $this->u;
        $h   = $this->h;
        $tgl = fn ($d) => $d ? Carbon::parse($d)->format('d/m/Y') : '-';

        $efektif = $h['hari_kerja'] - $h['izin'] - $h['sakit'];

        return collect([
            ['IDENTITAS', ''],                                                          // baris 4
            ['Nama', $u->name],                                                         // 5
            ['Email', $u->email],                                                       // 6
            ['Jenjang', $u->education_level ? strtoupper($u->education_level) : '-'],  // 7
            ['Asal Sekolah/Kampus', $u->instansi ?: '-'],                               // 8
            ['Divisi', $u->division?->name ?: ($u->divisi ?: '-')],                     // 9
            ['Periode', $tgl($u->start_date) . ' s.d. ' . $tgl($u->end_date)],          // 10
            ['Status', ucfirst((string) $u->status_magang)],                            // 11
            ['', ''],                                                                   // 12
            ['RINGKASAN KEHADIRAN', ''],                                                // 13
            ['Hari kerja', $h['hari_kerja']],                                           // 14
            ['Hari efektif (Hari kerja − Izin − Sakit)', $efektif],                     // 15
            ['Hadir', $h['hadir']],                                                     // 16
            ['Terlambat', $h['terlambat']],                                             // 17
            ['Izin', $h['izin']],                                                       // 18
            ['Sakit', $h['sakit']],                                                     // 19
            ['Alpha', $h['alpha']],                                                     // 20
            ['% Kehadiran', $h['persen'] === null ? '-' : $h['persen'] . '%'],         // 21
        ]);
    }

    public function columnWidths(): array
    {
        return ['A' => 40, 'B' => 46];
    }

    public function styles(Worksheet $sheet): array
    {
        Tampilan::judul($sheet, 'B', 'LAPORAN KEHADIRAN PESERTA MAGANG', 'Sistem Informasi Absensi Magang');

        $sheet->mergeCells('A3:B3');
        $sheet->setCellValue('A3', 'Dicetak: ' . now()->format('d/m/Y H:i'));
        $sheet->getStyle('A3')->applyFromArray(['font' => ['italic' => true, 'size' => 10, 'color' => ['rgb' => '64748B']]]);

        foreach (['A4:B4', 'A13:B13'] as $range) {
            Tampilan::header($sheet, $range);
            $sheet->getStyle($range)->getAlignment()->setHorizontal('left');
        }

        foreach (['A5:B11', 'A14:B21'] as $range) {
            Tampilan::body($sheet, $range);
        }

        foreach (['A5:A11', 'A14:A21'] as $range) {
            $sheet->getStyle($range)->applyFromArray([
                'font' => ['bold' => true, 'color' => ['rgb' => '334155']],
                'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => 'F1F5F9']],
            ]);
        }

        $sheet->getStyle('B5:B21')->getAlignment()->setHorizontal('left');

        $p   = $this->h['persen'];
        $rgb = $p === null ? '64748B' : ($p >= 80 ? '15803D' : ($p >= 50 ? 'B45309' : 'B91C1C'));
        $sheet->getStyle('B21')->applyFromArray(['font' => ['bold' => true, 'size' => 12, 'color' => ['rgb' => $rgb]]]);

        if ($this->h['alpha'] > 0) {
            $sheet->getStyle('B20')->applyFromArray(['font' => ['bold' => true, 'color' => ['rgb' => 'B91C1C']]]);
        }

        Tampilan::siapCetak($sheet, 4);
        

        return [];
    }
}