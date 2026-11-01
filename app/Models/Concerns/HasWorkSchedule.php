<?php

namespace App\Models\Concerns;

use App\Models\AppSetting;
use App\Models\Holiday;
use Carbon\Carbon;
use Carbon\CarbonInterface;

/**
 * @property string|null $work_pattern
 */
trait HasWorkSchedule
{
    public function isWorkday(CarbonInterface $date): bool
    {
        if ($date->isSunday() || in_array($date->toDateString(), Holiday::dates(), true)) {
            return false;
        }

        if (! $date->isSaturday()) {
            return true;
        }

        $pola = $this->work_pattern ?? 'weekday';

        if (! in_array($pola, ['saturday_a', 'saturday_alternate', 'saturday_b'], true)) {
            return false; // pola weekday: Sabtu libur
        }

        $acuan = Carbon::parse(
            AppSetting::get('saturday_anchor', config('absensi.saturday_anchor', '2026-10-31'))
        )->startOfWeek();

        $minggu = (int) round($acuan->diffInWeeks($date->copy()->startOfWeek(), false));
        $genap  = abs($minggu) % 2 === 0;

        return $pola === 'saturday_b' ? ! $genap : $genap;
    }
}