import { useEffect, useState } from 'react';
import type { Attendance } from './types';

export type AttendanceX = Attendance & { late_minutes: number; work_minutes: number | null };

export const pCard = 'rounded-3xl bg-white p-5 shadow-[0_2px_16px_rgba(194,65,12,0.08)]';

export const pBtn =
    'flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f97316] to-[#ea580c] px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:from-[#ea580c] hover:to-[#c2410c] active:scale-[0.99] disabled:bg-none disabled:bg-neutral-300 disabled:text-neutral-500 disabled:shadow-none';

export const pBtnGhost =
    'flex w-full items-center justify-center gap-2 rounded-full border border-orange-200 bg-white px-6 py-3 text-sm font-medium text-neutral-800 transition hover:bg-orange-50';

/** "08:17:00" -> "08.17" */
export const fmtTime = (t: string | null | undefined) => (t ? t.slice(0, 5).replace(':', '.') : '-');

/** 525 -> "8 j 45 m" */
export const fmtDuration = (m: number | null) => (m === null ? '-' : `${Math.floor(m / 60)} j ${m % 60} m`);

/** 183 -> "3 jam 3 menit", 45 -> "45 menit", 120 -> "2 jam" */
export const fmtLate = (menit: number) => {
    const j = Math.floor(menit / 60);
    const m = menit % 60;
    if (j === 0) return `${m} menit`;
    return m === 0 ? `${j} jam` : `${j} jam ${m} menit`;
};

export const fmtDate = (date: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(`${date}T00:00:00`).toLocaleDateString('id-ID', opts);

/** Jam berjalan. Hanya untuk tampilan: waktu absen yang sah tetap dari server. */
export function useClock() {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);
    return now;
}

export function StatusPill({ status, late = 0 }: { status: string; late?: number | null }) {
    const lateMin = late ?? 0;
    const map: Record<string, [string, string]> = {
        hadir: ['Tepat waktu', 'bg-green-100 text-green-800'],
        terlambat: [lateMin > 0 ? `Terlambat ${fmtLate(lateMin)}` : 'Terlambat', 'bg-orange-100 text-orange-800'],
        izin: ['Izin', 'bg-blue-100 text-blue-800'],
        sakit: ['Sakit', 'bg-blue-100 text-blue-800'],
        alpha: ['Alpha', 'bg-red-100 text-red-800'],
    };
    const [label, cls] = map[status] ?? [status, 'bg-neutral-100 text-neutral-700'];
    return <span className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${cls}`}>{label}</span>;
}