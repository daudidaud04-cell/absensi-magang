import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import CaptureAttendance from '@/components/siam/CaptureAttendance';
import { fmtTime, pCard, useClock } from '@/components/siam/peserta-ui';
import type { AttendanceX } from '@/components/siam/peserta-ui';
import type { Office } from '@/components/siam/types';

type OfficeX = Office & { pulang_dibuka?: string };

export default function Absen({ mode, office, today }: { mode: 'masuk' | 'pulang'; office: OfficeX; today: AttendanceX | null }) {
    const now = useClock();
    const time = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
    const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const title = mode === 'masuk' ? 'Absen Masuk' : 'Absen Pulang';

    // Jam absen pulang dibuka (dihitung di server); keputusan sahnya tetap di server
    const pulangDibuka = office.pulang_dibuka ?? office.jam_pulang.slice(0, 5);
    const pulangOpen = time.replace('.', ':') >= pulangDibuka;

    return (
        <>
            <Head title={title} />

            <div className="flex items-center gap-3">
                <Link
                    href="/absensi"
                    aria-label="Kembali ke Beranda"
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow transition active:scale-95"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-lg font-semibold">{title}</h1>
            </div>

            <section className={pCard}>
                <p className="text-sm text-neutral-500" suppressHydrationWarning>
                    {dateStr}
                </p>
                <p className="font-serif text-4xl tabular-nums" suppressHydrationWarning>
                    {time.replace(':', '.')}
                </p>
                {mode === 'pulang' && today?.time_in && (
                    <p className="mt-1 text-sm text-neutral-600">Sudah masuk pukul {fmtTime(today.time_in)}.</p>
                )}
            </section>

            {mode === 'pulang' && !pulangOpen ? (
                <section className={`${pCard} text-center text-sm text-neutral-600`}>
                    Belum waktunya pulang. Absen pulang dibuka pukul <b>{fmtTime(pulangDibuka)}</b>.
                </section>
            ) : (
                <CaptureAttendance mode={mode} office={office} initialLogbook={today?.logbook ?? ''} />
            )}
        </>
    );
}