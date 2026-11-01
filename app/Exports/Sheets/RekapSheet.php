<?php

namespace App\Exports\Sheets;

use App\Exports\Support\Tampilan;
use App\Models\User;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\WithStrictNullComparison;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithCustomStartCell;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class RekapSheet implements FromCollection, WithHeadings, WithTitle, WithStyles, WithColumnWidths, WithColumnFormatting, WithCustomStartCell, WithStrictNullComparison
{
    private const LAST  = 'P';
    private const FIRST = 5;   // baris data pertama (header di baris 4)

    public function __construct(private Collection $users, private Collection $hitung) {}

    public function title(): string
    {
        return 'Rekap';
    }

    public function startCell(): string
    {
        return 'A4';
    }

    public function headings(): array
    {
        return ['No', 'Nama', 'Email', 'Jenjang', 'Asal Sekolah/Kampus', 'Divisi', 'Status', 'Mulai', 'Selesai',
                'Hari Kerja', 'Hadir', 'Terlambat', 'Izin', 'Sakit', 'Alpha', '% Kehadiran'];
    }

    public function collection(): Collection
    {
        $tgl = fn ($d) => $d ? Carbon::parse($d)->format('d/m/Y') : '-';

        return $this->users->values()->map(function (User $u, $i) use ($tgl) {
            $h = $this->hitung[$u->id];

            return [
                $i + 1,
                $u->name,
                $u->email,
                $u->education_level ? strtoupper($u->education_level) : '-',
                $u->instansi ?: '-',
                $u->division?->name ?: ($u->divisi ?: '-'),
                ucfirst((string) $u->status_magang),
                $tgl($u->start_date),
                $tgl($u->end_date),
                $h['hari_kerja'],
                $h['hadir'],
                $h['terlambat'],
                $h['izin'],
                $h['sakit'],
                $h['alpha'],
                $h['persen'] === null ? '-' : $h['persen'] / 100,
            ];
        });
    }

    public function columnWidths(): array
        {
            return ['A' => 6, 'B' => 32, 'C' => 30, 'D' => 12, 'E' => 30, 'F' => 14, 'G' => 12, 'H' => 13,
                    'I' => 13, 'J' => 13, 'K' => 10, 'L' => 12, 'M' => 9, 'N' => 9, 'O' => 9, 'P' => 15];
        }

    public function columnFormats(): array
    {
        return ['P' => '0%'];
    }

    public function styles(Worksheet $sheet): array
    {
        $n    = $this->users->count();
        $last = max(self::FIRST, 4 + $n);

        $persen = $this->users->map(fn ($u) => $this->hitung[$u->id]['persen'])->filter(fn ($p) => $p !== null);
        $rata   = $persen->isEmpty() ? '-' : round($persen->avg()) . '%';

        Tampilan::judul($sheet, self::LAST, 'REKAP KEHADIRAN PESERTA MAGANG', 'Sistem Informasi Absensi Magang');

        $sheet->mergeCells('A3:' . self::LAST . '3');
        $sheet->setCellValue('A3', "Jumlah peserta: {$n}   |   Rata-rata kehadiran: {$rata}   |   Dicetak: " . now()->format('d/m/Y H:i'));
        $sheet->getStyle('A3')->applyFromArray(['font' => ['italic' => true, 'size' => 10, 'color' => ['rgb' => '64748B']]]);

        Tampilan::header($sheet, 'A4:' . self::LAST . '4');
        $sheet->getRowDimension(4)->setRowHeight(32);

        if ($n > 0) {
            Tampilan::body($sheet, 'A' . self::FIRST . ':' . self::LAST . $last);
            Tampilan::zebra($sheet, 'A', self::LAST, self::FIRST, $last);

            foreach (['A', 'D', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'] as $col) {
                Tampilan::center($sheet, "{$col}" . self::FIRST . ":{$col}{$last}");
            }

            foreach ($this->users->values() as $i => $u) {
                $row = self::FIRST + $i;
                $h   = $this->hitung[$u->id];
                $p   = $h['persen'];

                $rgb = $p === null ? '64748B' : ($p >= 80 ? '15803D' : ($p >= 50 ? 'B45309' : 'B91C1C'));
                $sheet->getStyle("P{$row}")->applyFromArray(['font' => ['bold' => true, 'color' => ['rgb' => $rgb]]]);

                if ($h['alpha'] > 0) {
                    $sheet->getStyle("O{$row}")->applyFromArray(['font' => ['bold' => true, 'color' => ['rgb' => 'B91C1C']]]);
                }
            }
        }

     
        $sheet->setAutoFilter('A4:' . self::LAST . $last);
        Tampilan::siapCetak($sheet, 4);

        return [];
    }
}