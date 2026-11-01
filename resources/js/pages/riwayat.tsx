import { Head, Link, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fmtDate, fmtDuration, fmtTime, pCard, StatusPill } from '@/components/siam/peserta-ui';
import type { AttendanceX } from '@/components/siam/peserta-ui';

type Props = {
    month: string;
    prev: string;
    next: string | null;
    summary: { present: number; workdays: number };
    records: AttendanceX[];
};

const dot: Record<string, string> = {
    hadir: 'bg-green-500',
    terlambat: 'bg-orange-500',
    izin: 'bg-blue-500',
    sakit: 'bg-blue-500',
    alpha: 'bg-red-500',
};

function localToday() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function Riwayat({ month, prev, next, summary, records }: Props) {
    // Tanggal bisa dikirim lewat alamat halaman: /riwayat?month=2026-10&date=2026-10-27
    const { url } = usePage();
    const queryDate = new URLSearchParams(url.split('?')[1] ?? '').get('date');
    const initialDate = queryDate && queryDate.startsWith(month) ? queryDate : null;

    const [selected, setSelected] = useState<string | null>(initialDate);

    // Pindah bulan atau tanggal dari alamat berubah: sinkronkan pilihan
    useEffect(() => {
        setSelected(initialDate);
    }, [month, initialDate]);

    const [y, m] = month.split('-').map(Number);
    const label = new Date(y, m - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    const offset = (new Date(y, m - 1, 1).getDay() + 6) % 7; // Senin = 0
    const daysInMonth = new Date(y, m, 0).getDate();
    const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
    const byDate = new Map(records.map((r) => [r.date, r]));
    const percent = summary.workdays ? Math.round((summary.present / summary.workdays) * 100) : 0;
    const todayKey = localToday();

    const selectedRecord = selected ? byDate.get(selected) : undefined;

    return (
        <>
            <Head title="Riwayat" />

            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Riwayat</h1>
                <div className="flex items-center gap-1 rounded-full bg-white px-1 py-1 shadow">
                    <Link href={`/riwayat?month=${prev}`} className="rounded-full p-1.5 hover:bg-neutral-100">
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                    <span className="min-w-28 text-center text-sm font-medium capitalize">{label}</span>
                    {next ? (
                        <Link href={`/riwayat?month=${next}`} className="rounded-full p-1.5 hover:bg-neutral-100">
                            <ChevronRight className="h-5 w-5" />
                        </Link>
                    ) : (
                        <span className="p-1.5 text-neutral-300">
                            <ChevronRight className="h-5 w-5" />
                        </span>
                    )}
                </div>
            </div>

            <section className={pCard}>
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-sm text-neutral-500">Kehadiran</p>
                        <p className="text-3xl font-bold">
                            {summary.present} <span className="text-base font-normal text-neutral-500">dari {summary.workdays} hari kerja</span>
                        </p>
                    </div>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">{percent}%</span>
                </div>
            </section>

            <section className={pCard}>
                <div className="grid grid-cols-7 gap-y-1 text-center text-xs text-neutral-500">
                    {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((d) => (
                        <span key={d} className="pb-1">
                            {d}
                        </span>
                    ))}
                    {cells.map((day, i) => {
                        if (day === null) return <span key={`e${i}`} />;
                        const key = `${month}-${String(day).padStart(2, '0')}`;
                        const rec = byDate.get(key);
                        const isSelected = selected === key;
                        const isToday = key === todayKey;

                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setSelected(isSelected ? null : key)}
                                aria-pressed={isSelected}
                                className={`mx-auto flex h-11 w-11 flex-col items-center justify-center gap-0.5 rounded-xl text-sm transition ${
                                    isSelected
                                        ? 'bg-neutral-900 text-white'
                                        : `text-neutral-800 hover:bg-neutral-100 ${isToday ? 'ring-1 ring-orange-400' : ''}`
                                }`}
                            >
                                {day}
                                <span className={`h-1.5 w-1.5 rounded-full ${rec ? (dot[rec.status] ?? 'bg-neutral-400') : 'bg-transparent'}`} />
                            </button>
                        );
                    })}
                </div>
                <div className="mt-3 flex justify-center gap-4 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-green-500" /> Tepat waktu
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-orange-500" /> Terlambat
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-blue-500" /> Izin/Sakit
                    </span>
                </div>
                {!selected && <p className="mt-2 text-center text-xs text-neutral-400">Ketuk tanggal untuk melihat detail</p>}
            </section>

            {selected ? (
                <section className={pCard}>
                    <div className="mb-3 flex items-start justify-between gap-3">
                        <h2 className="font-semibold">
                            {fmtDate(selected, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </h2>
                        <button className="shrink-0 text-xs font-medium text-orange-600" onClick={() => setSelected(null)}>
                            Tampilkan semua
                        </button>
                    </div>

                    {selectedRecord ? (
                        <div className="space-y-3 text-sm">
                            <StatusPill status={selectedRecord.status} late={selectedRecord.late_minutes} />
                            <dl className="divide-y">
                                <div className="flex justify-between py-2">
                                    <dt className="text-neutral-500">Masuk</dt>
                                    <dd className="font-medium">{fmtTime(selectedRecord.time_in)}</dd>
                                </div>
                                <div className="flex justify-between py-2">
                                    <dt className="text-neutral-500">Pulang</dt>
                                    <dd className="font-medium">{fmtTime(selectedRecord.time_out)}</dd>
                                </div>
                                <div className="flex justify-between py-2">
                                    <dt className="text-neutral-500">Durasi kerja</dt>
                                    <dd className="font-medium">{fmtDuration(selectedRecord.work_minutes)}</dd>
                                </div>
                            </dl>
                            {selectedRecord.logbook && (
                                <div>
                                    <p className="mb-1 text-neutral-500">Jurnal kegiatan</p>
                                    <p className="whitespace-pre-line rounded-2xl bg-neutral-50 p-3">{selectedRecord.logbook}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-neutral-500">Tidak ada catatan absen pada tanggal ini.</p>
                    )}
                </section>
            ) : (
                <section className={pCard}>
                    <h2 className="mb-2 font-semibold">Rincian</h2>
                    <ul className="divide-y">
                        {records.map((r) => (
                            <li key={r.id}>
                                <button
                                    type="button"
                                    onClick={() => setSelected(r.date)}
                                    className="flex w-full items-center justify-between gap-3 py-3 text-left text-sm"
                                >
                                    <div>
                                        <p className="font-medium">{fmtDate(r.date, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                        <p className="text-neutral-500">
                                            {fmtTime(r.time_in)} - {fmtTime(r.time_out)}
                                            {r.work_minutes !== null && ` · ${fmtDuration(r.work_minutes)}`}
                                        </p>
                                    </div>
                                    <StatusPill status={r.status} late={r.late_minutes} />
                                </button>
                            </li>
                        ))}
                        {!records.length && <li className="py-3 text-sm text-neutral-500">Belum ada data di bulan ini.</li>}
                    </ul>
                </section>
            )}
        </>
    );
}