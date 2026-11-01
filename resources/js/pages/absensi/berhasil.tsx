import { Head, Link } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { fmtDate, fmtDuration, fmtTime, pBtn, pCard, StatusPill } from '@/components/siam/peserta-ui';
import type { AttendanceX } from '@/components/siam/peserta-ui';

export default function Berhasil({ record }: { record: AttendanceX }) {
    const pulang = !!record.time_out;

    return (
        <>
            <Head title="Absen tercatat" />

            <section className={`${pCard} flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center`}>
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <Check className="h-9 w-9" />
                </span>
                <h1 className="text-xl font-semibold">{pulang ? 'Absen pulang tercatat' : 'Absen masuk tercatat'}</h1>
                <p className="text-sm text-neutral-600">
                    {pulang ? 'Pulang' : 'Masuk'} {fmtTime(pulang ? record.time_out : record.time_in)} ·{' '}
                    {fmtDate(record.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <StatusPill status={record.status} late={record.late_minutes} />
                {pulang && <p className="text-sm text-neutral-500">Total jam kerja {fmtDuration(record.work_minutes)}</p>}
                <Link href="/absensi" className={`${pBtn} mt-4`}>
                    Kembali ke Beranda
                </Link>
            </section>
        </>
    );
}