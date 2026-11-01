import { Head, Link } from '@inertiajs/react';
import { Camera, Check, ChevronRight, Clock, Minus, X } from 'lucide-react';
import { fmtTime, pBtn, pCard, StatusPill, useClock } from '@/components/siam/peserta-ui';
import type { AttendanceX } from '@/components/siam/peserta-ui';
import type { Office } from '@/components/siam/types';

type WeekDay = { date: string; label: string; status: string | null; workday: boolean; is_today: boolean };

type OfficeX = Office & { pulang_dibuka?: string };

type Props = {
    profile: {
        name: string;
        instansi: string | null;
        start_date: string | null;
        end_date: string | null;
        status_magang: string;
        sisa_hari: number | null;
    };
    office: OfficeX | null;
    today: AttendanceX | null;
    blocked: string | null;
    week: WeekDay[];
    recent: AttendanceX[];
};

/** Alamat Riwayat yang langsung membuka detail satu tanggal */
const riwayatUrl = (date: string) => `/riwayat?month=${date.slice(0, 7)}&date=${date}`;

function Day({ d, todayStr }: { d: WeekDay; todayStr: string }) {
    let cls = 'border-neutral-200 bg-white';
    let icon: React.ReactNode = null;
    let hint = '';

    if (d.status === 'hadir') {
        cls = 'border-green-300 bg-green-100 text-green-700';
        icon = <Check className="h-4 w-4" />;
        hint = 'Tepat waktu';
    } else if (d.status === 'terlambat') {
        cls = 'border-orange-300 bg-orange-100 text-orange-700';
        icon = <Clock className="h-4 w-4" />;
        hint = 'Terlambat';
    } else if (d.status === 'izin' || d.status === 'sakit') {
        cls = 'border-blue-300 bg-blue-100 text-blue-700';
        icon = <span className="text-xs font-semibold">{d.status === 'izin' ? 'I' : 'S'}</span>;
        hint = d.status === 'izin' ? 'Izin' : 'Sakit';
    } else if (d.status === 'alpha') {
        cls = 'border-red-300 bg-red-100 text-red-700';
        icon = <X className="h-4 w-4" />;
        hint = 'Alpha';
    } else if (!d.workday) {
        cls = 'border-dashed border-neutral-300 bg-neutral-100 text-neutral-400';
        icon = <Minus className="h-4 w-4" />;
        hint = 'Libur';
    } else if (d.date > todayStr) {
        cls = 'border-neutral-200 bg-white';
        hint = 'Belum terjadi';
    } else if (d.is_today) {
        cls = 'border-orange-400 bg-white ring-2 ring-orange-200';
        hint = 'Hari ini, belum absen';
    } else {
        cls = 'border-dashed border-amber-300 bg-amber-50 text-amber-600';
        icon = <Minus className="h-4 w-4" />;
        hint = 'Tidak ada data';
    }

    const content = (
        <>
            <span className={`text-xs lg:text-sm ${d.is_today ? 'font-bold text-neutral-900' : 'text-neutral-500'}`}>{d.label}</span>
            <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border min-[400px]:h-9 min-[400px]:w-9 lg:h-11 lg:w-11 ${cls}`}
            >
                {icon}
            </div>
        </>
    );

    const wrap = 'flex min-h-11 min-w-9 flex-col items-center gap-1.5';

    if (d.status) {
        return (
            <Link href={riwayatUrl(d.date)} title={hint} aria-label={`${d.label}: ${hint}`} className={`${wrap} transition active:scale-95`}>
                {content}
            </Link>
        );
    }

    return (
        <div title={hint} aria-label={`${d.label}: ${hint}`} className={wrap}>
            {content}
        </div>
    );
}

const legenda: [string, string][] = [
    ['bg-green-200', 'Tepat waktu'],
    ['bg-orange-200', 'Terlambat'],
    ['bg-blue-200', 'Izin/Sakit'],
    ['bg-neutral-200', 'Libur'],
];

export default function Beranda({ profile, office, today, blocked, week, recent }: Props) {
    const now = useClock();
    const time = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
    const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const todayStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD, waktu lokal

    const tepat = week.filter((d) => d.status === 'hadir').length;
    const telat = week.filter((d) => d.status === 'terlambat').length;
    const selesai = !!today?.time_out;

    const pulangDibuka = office?.pulang_dibuka ?? office?.jam_pulang?.slice(0, 5) ?? '17:00';
    const pulangOpen = !office || time.replace('.', ':') >= pulangDibuka;

    // Lingkaran jam: abu-abu jika tidak bisa absen, hijau jika selesai, oranye jika bisa absen
    const ringCls = blocked || !office ? 'border-neutral-300' : selesai ? 'border-green-500' : 'border-orange-500';

    let cta: React.ReactNode;
    if (blocked) {
        cta = <p className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-800">{blocked}</p>;
    } else if (!office) {
        cta = <p className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-800">Pengaturan kantor belum dibuat oleh admin.</p>;
    } else if (!today) {
        cta = (
            <Link href="/absensi/absen" className={pBtn}>
                <Camera className="h-5 w-5" /> Absen Masuk
            </Link>
        );
    } else if (today.time_in && !today.time_out) {
        cta = pulangOpen ? (
            <Link href="/absensi/absen" className={pBtn}>
                <Camera className="h-5 w-5" /> Absen Pulang
            </Link>
        ) : (
            <p className="rounded-2xl bg-neutral-100 px-4 py-4 text-center text-sm font-medium text-neutral-600">
                Absen pulang dibuka pukul {fmtTime(pulangDibuka)}
            </p>
        );
    } else if (selesai) {
        cta = (
            <Link
                href="/absensi/berhasil"
                className="flex items-center justify-center gap-1 rounded-2xl bg-green-50 px-4 py-4 text-center text-sm font-semibold text-green-700 transition hover:bg-green-100"
            >
                Sudah selesai · Lihat ringkasan <ChevronRight className="h-4 w-4 shrink-0" />
            </Link>
        );
    } else {
        cta = <p className="rounded-2xl bg-blue-50 px-4 py-3 text-center text-sm text-blue-800">Hari ini tercatat sebagai {today.status}.</p>;
    }

    return (
        <>
            <Head title="Beranda" />

            <div className="space-y-4 lg:space-y-6">
                {/* Sapaan */}
                <div>
                    <h1 className="text-2xl font-bold lg:text-3xl">Halo, {profile.name.split(' ')[0]}</h1>
                    <p className="text-sm text-neutral-500 lg:text-base" suppressHydrationWarning>
                        {dateStr}
                        {profile.sisa_hari !== null && profile.status_magang === 'aktif' && ` · Sisa ${profile.sisa_hari} hari magang`}
                    </p>
                </div>

                {/* HP: satu kolom. Komputer: kiri (absen + ringkasan), kanan (riwayat) */}
                <div className="grid gap-4 lg:grid-cols-12 lg:items-start lg:gap-6">
                    <div className="space-y-4 lg:col-span-7 lg:space-y-6">
                        <section className={pCard}>
                            <div className="flex items-center justify-between gap-2">
                                <h2 className="font-semibold">Absen Sekarang</h2>
                                {today ? (
                                    <StatusPill status={today.status} late={today.late_minutes} />
                                ) : (
                                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                                        Belum absen
                                    </span>
                                )}
                            </div>

                            <div className="my-5 flex items-center gap-4 min-[400px]:gap-5 lg:gap-10 lg:py-2">
                                <div
                                    className={`flex h-32 w-32 shrink-0 items-center justify-center rounded-full border-[9px] min-[400px]:h-36 min-[400px]:w-36 min-[400px]:border-[10px] lg:h-44 lg:w-44 ${ringCls}`}
                                >
                                    <span className="font-serif text-3xl text-neutral-900 lg:text-4xl" suppressHydrationWarning>
                                        {time}
                                    </span>
                                </div>
                                <dl className="min-w-0 space-y-3 text-sm">
                                    <div>
                                        <dt className="text-neutral-500">Mulai</dt>
                                        <dd className="text-xl font-semibold lg:text-2xl">{fmtTime(office?.jam_masuk)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-neutral-500">Selesai</dt>
                                        <dd className="text-xl font-semibold lg:text-2xl">{fmtTime(office?.jam_pulang)}</dd>
                                    </div>
                                </dl>
                            </div>

                            {today?.time_in && (
                                <p className="mb-4 text-sm text-neutral-600">
                                    Masuk <b>{fmtTime(today.time_in)}</b>
                                    {today.time_out && (
                                        <>
                                            {' · '}Pulang <b>{fmtTime(today.time_out)}</b>
                                        </>
                                    )}
                                </p>
                            )}

                            {cta}
                        </section>

                        <section className={pCard}>
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="font-semibold">Ringkasan Kehadiran</h2>
                                <span className="text-sm text-neutral-500">Minggu ini</span>
                            </div>

                            <div className="flex justify-between lg:px-4">
                                {week.map((d) => (
                                    <Day key={d.date} d={d} todayStr={todayStr} />
                                ))}
                            </div>

                            <p className="mt-4 text-center text-sm text-neutral-500">
                                {tepat} tepat waktu · {telat} terlambat minggu ini
                            </p>

                            <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-neutral-500">
                                {legenda.map(([warna, label]) => (
                                    <span key={label} className="inline-flex items-center gap-1.5">
                                        <span className={`h-2.5 w-2.5 rounded-full ${warna}`} />
                                        {label}
                                    </span>
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="lg:col-span-5">
                        <section className={pCard}>
                            <div className="mb-1 flex items-center justify-between">
                                <h2 className="font-semibold">Riwayat Absen</h2>
                                <Link href="/riwayat" className="-m-2 p-2 text-sm font-medium text-orange-600">
                                    Lihat semua
                                </Link>
                            </div>

                            <ul className="divide-y">
                                {recent.map((a) => {
                                    const lupaPulang =
                                        a.date < todayStr &&
                                        !!a.time_in &&
                                        !a.time_out &&
                                        (a.status === 'hadir' || a.status === 'terlambat');

                                    return (
                                        <li key={a.id}>
                                            <Link
                                                href={riwayatUrl(a.date)}
                                                className="flex min-h-14 items-center justify-between gap-3 py-3 text-sm"
                                            >
                                                <div className="min-w-0">
                                                    <p className="font-medium">
                                                        {new Date(`${a.date}T00:00:00`).toLocaleDateString('id-ID', {
                                                            weekday: 'short',
                                                            day: 'numeric',
                                                            month: 'short',
                                                        })}
                                                    </p>

                                                    <p className="text-neutral-500">
                                                        {a.time_in ? `Masuk ${fmtTime(a.time_in)}` : 'Tidak ada jam absen'}
                                                        {a.time_out && ` · Pulang ${fmtTime(a.time_out)}`}
                                                    </p>

                                                    {lupaPulang && <p className="text-xs font-medium text-red-600">Lupa absen pulang</p>}
                                                </div>

                                                <div className="flex shrink-0 items-center gap-1">
                                                    <StatusPill status={a.status} late={a.late_minutes} />
                                                    <ChevronRight className="h-4 w-4 text-neutral-400" />
                                                </div>
                                            </Link>
                                        </li>
                                    );
                                })}
                                {!recent.length && <li className="py-3 text-sm text-neutral-500">Belum ada riwayat.</li>}
                            </ul>
                        </section>
                    </div>
                </div>
            </div>
        </>
    );
}