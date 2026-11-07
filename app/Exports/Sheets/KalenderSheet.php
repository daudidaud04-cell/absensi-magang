<?php

namespace App\Exports\Sheets;

use App\Exports\Support\Tampilan;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithCustomStartCell;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class KalenderSheet implements FromCollection, WithHeadings, WithTitle, WithStyles, WithColumnWidths, WithCustomStartCell
{
    private const HARI  = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    private const FIRST = 5; // baris data pertama (header di baris 4)

    /** @var Carbon[] */
    private array $tanggal = [];

    private array $cache = [];

    public function __construct(
        private Collection $users,
        private Collection $hitung,
        private Carbon $start,
        private Carbon $end,
    ) {
        for ($d = $start->copy(); $d->lte($end); $d->addDay()) {
            $this->tanggal[] = $d->copy();
        }
    }

    public function title(): string
    {
        return 'Kalender';
    }

    public function startCell(): string
    {
        return 'A4';
    }

    private function lastCol(): string
    {
        return Coordinate::stringFromColumnIndex(2 + count($this->tanggal) + 5);
    }

    public function headings(): array
    {
        $hari = array_map(
            fn (Carbon $d) => $d->day . "\n" . self::HARI[$d->dayOfWeek],
            $this->tanggal
        );

        return array_merge(['No', 'Nama'], $hari, ['Hadir', 'Telat', 'Izin', 'Sakit', 'Alpha']);
    }

    /** [Y-m-d => status huruf kecil] untuk satu peserta */
    private function statusPerTanggal($u): array
    {
        if (isset($this->cache[$u->id])) {
            return $this->cache[$u->id];
        }

        $map = [];

        foreach ($this->hitung[$u->id]['detail'] ?? [] as $d) {
            $map[Carbon::parse($d['tanggal'])->toDateString()] = strtolower((string) $d['status']);
        }

        return $this->cache[$u->id] = $map;
    }

    private function kode(?string $status): string
    {
        if (! $status) {
            return '';
        }

        return match (true) {
            str_contains($status, 'di luar jadwal') => 'L',
            str_starts_with($status, 'hadir')       => 'H',
            str_starts_with($status, 'terlambat')   => 'T',
            str_starts_with($status, 'izin')        => 'I',
            str_starts_with($status, 'sakit')       => 'S',
            str_starts_with($status, 'alpha')       => 'A',
            default                                 => '',
        };
    }

    public function collection(): Collection
    {
        return $this->users->values()->map(function ($u, $i) {
            $status = $this->statusPerTanggal($u);
            $h      = $this->hitung[$u->id];

            $hari = array_map(
                fn (Carbon $d) => $this->kode($status[$d->toDateString()] ?? null),
                $this->tanggal
            );

            return array_merge(
                [$i + 1, $u->name],
                $hari,
                [$h['hadir'], $h['terlambat'], $h['izin'], $h['sakit'], $h['alpha']]
            );
        });
    }

    public function columnWidths(): array
    {
        $w = ['A' => 5, 'B' => 28];

        foreach ($this->tanggal as $i => $_) {
            $w[Coordinate::stringFromColumnIndex(3 + $i)] = 5;
        }

        $tot = 3 + count($this->tanggal);

        for ($k = 0; $k < 5; $k++) {
            $w[Coordinate::stringFromColumnIndex($tot + $k)] = 8;
        }

        return $w;
    }

    public function styles(Worksheet $sheet): array
    {
        $n    = $this->users->count();
        $last = max(self::FIRST, 4 + $n);
        $lc   = $this->lastCol();
        $bln  = $this->start->copy()->locale('id')->translatedFormat('F Y');

        Tampilan::judul($sheet, $lc, 'KALENDER KEHADIRAN BULANAN', "Periode: {$bln}");

        $sheet->mergeCells("A3:{$lc}3");
        $sheet->setCellValue('A3', 'H = Hadir   |   T = Terlambat   |   I = Izin   |   S = Sakit   |   A = Alpha   |   L = Di luar jadwal   |   Kosong = tidak ada catatan / hari libur');
        $sheet->getStyle('A3')->applyFromArray(['font' => ['italic' => true, 'size' => 10, 'color' => ['rgb' => '64748B']]]);

        Tampilan::header($sheet, "A4:{$lc}4");
        $sheet->getRowDimension(4)->setRowHeight(34);

        if ($n > 0) {
            Tampilan::body($sheet, 'A' . self::FIRST . ":{$lc}{$last}");
            Tampilan::center($sheet, 'A' . self::FIRST . ":A{$last}");

            // Kolom akhir pekan: header lebih gelap, badan abu-abu muda
            foreach ($this->tanggal as $i => $d) {
                $col = Coordinate::stringFromColumnIndex(3 + $i);

                Tampilan::center($sheet, "{$col}" . self::FIRST . ":{$col}{$last}");

                if ($d->isWeekend()) {
                    $sheet->getStyle("{$col}4")->getFill()->getStartColor()->setRGB('64748B');
                    $sheet->getStyle("{$col}" . self::FIRST . ":{$col}{$last}")->applyFromArray([
                        'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => 'F1F5F9']],
                    ]);
                }
            }

            // Kolom total
            $tot = 3 + count($this->tanggal);
            $c1  = Coordinate::stringFromColumnIndex($tot);
            Tampilan::center($sheet, "{$c1}" . self::FIRST . ":{$lc}{$last}");

            // Warna sel status
            foreach ($this->users->values() as $r => $u) {
                $row    = self::FIRST + $r;
                $status = $this->statusPerTanggal($u);

                foreach ($this->tanggal as $i => $d) {
                    $s = $status[$d->toDateString()] ?? null;

                    if ($s && $this->kode($s) !== '') {
                        $col = Coordinate::stringFromColumnIndex(3 + $i);
                        Tampilan::beriWarnaStatus($sheet, "{$col}{$row}", $s);
                    }
                }

                if (($this->hitung[$u->id]['alpha'] ?? 0) > 0) {
                    $colAlpha = Coordinate::stringFromColumnIndex($tot + 4);
                    $sheet->getStyle("{$colAlpha}{$row}")->applyFromArray([
                        'font' => ['bold' => true, 'color' => ['rgb' => 'B91C1C']],
                    ]);
                }
            }
        }

        $sheet->freezePane('C' . self::FIRST);
        Tampilan::siapCetak($sheet, 4);

        return [];
    }
}