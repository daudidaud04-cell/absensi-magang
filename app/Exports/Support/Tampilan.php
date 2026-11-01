<?php

namespace App\Exports\Support;

use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class Tampilan
{
    public const NAVY   = '1E293B';
    public const BORDER = 'CBD5E1';

    public static function judul(Worksheet $s, string $lastCol, string $judul, string $sub): void
    {
        $s->mergeCells("A1:{$lastCol}1");
        $s->mergeCells("A2:{$lastCol}2");
        $s->setCellValue('A1', $judul);
        $s->setCellValue('A2', $sub);

        $s->getStyle('A1')->applyFromArray([
            'font'      => ['bold' => true, 'size' => 16, 'color' => ['rgb' => '0F172A']],
            'alignment' => ['vertical' => 'center'],
        ]);
        $s->getStyle('A2')->applyFromArray([
            'font' => ['size' => 11, 'color' => ['rgb' => '475569']],
        ]);
        $s->getRowDimension(1)->setRowHeight(30);
    }

    public static function header(Worksheet $s, string $range): void
    {
        $s->getStyle($range)->applyFromArray([
            'font'      => ['bold' => true, 'size' => 11, 'color' => ['rgb' => 'FFFFFF']],
            'fill'      => ['fillType' => 'solid', 'startColor' => ['rgb' => self::NAVY]],
            'alignment' => ['horizontal' => 'center', 'vertical' => 'center', 'wrapText' => true],
            'borders'   => ['allBorders' => ['borderStyle' => 'thin', 'color' => ['rgb' => self::BORDER]]],
        ]);
    }

    public static function body(Worksheet $s, string $range): void
    {
        $s->getStyle($range)->applyFromArray([
            'alignment' => ['vertical' => 'center'],
            'borders'   => ['allBorders' => ['borderStyle' => 'thin', 'color' => ['rgb' => self::BORDER]]],
        ]);
    }

    public static function center(Worksheet $s, string $range): void
    {
        $s->getStyle($range)->getAlignment()->setHorizontal('center');
    }

    public static function zebra(Worksheet $s, string $firstCol, string $lastCol, int $from, int $to): void
    {
        for ($r = $from; $r <= $to; $r++) {
            if (($r - $from) % 2 === 1) {
                $s->getStyle("{$firstCol}{$r}:{$lastCol}{$r}")->applyFromArray([
                    'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => 'F8FAFC']],
                ]);
            }
        }
    }

    /** [warna huruf, warna latar] untuk sel status */
    public static function warnaStatus(string $status): array
    {
        return match (true) {
            str_contains($status, 'di luar jadwal')                                      => ['475569', 'E2E8F0'],
            str_starts_with($status, 'hadir')                                            => ['166534', 'DCFCE7'],
            str_starts_with($status, 'terlambat')                                        => ['854D0E', 'FEF9C3'],
            str_starts_with($status, 'izin'), str_starts_with($status, 'sakit')          => ['075985', 'E0F2FE'],
            str_starts_with($status, 'alpha')                                            => ['991B1B', 'FEE2E2'],
            default                                                                      => ['334155', 'FFFFFF'],
        };
    }

    public static function beriWarnaStatus(Worksheet $s, string $cell, string $status): void
    {
        [$font, $fill] = self::warnaStatus($status);

        $s->getStyle($cell)->applyFromArray([
            'font'      => ['bold' => true, 'color' => ['rgb' => $font]],
            'fill'      => ['fillType' => 'solid', 'startColor' => ['rgb' => $fill]],
            'alignment' => ['horizontal' => 'center'],
        ]);
    }

    public static function siapCetak(Worksheet $s, int $headerRow): void
    {
        $s->setShowGridlines(true);
        $page = $s->getPageSetup();
        $page->setOrientation('landscape');
        $page->setPaperSize(\PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::PAPERSIZE_A4);
        $page->setFitToPage(true);
        $page->setFitToWidth(1);
        $page->setFitToHeight(0);
        $page->setRowsToRepeatAtTopByStartAndEnd($headerRow, $headerRow);
    }
}