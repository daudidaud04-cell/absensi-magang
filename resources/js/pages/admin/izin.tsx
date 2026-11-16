import SiamLayout from '@/components/siam/layout';
import { fieldCls, focusRing, PageHeader, Panel, SearchBox } from '@/components/siam/kit';
import type { LeaveRequest } from '@/components/siam/types';
import { Badge } from '@/components/siam/ui';
import { router } from '@inertiajs/react';
import { Check, FileText, RotateCcw, X } from 'lucide-react';
import { useMemo, useState } from 'react';

const tabs = [
    ['semua', 'Semua'],
    ['pending', 'Menunggu'],
    ['approved', 'Disetujui'],
    ['rejected', 'Ditolak'],
    ['cancelled', 'Dibatalkan'],
] as const;

type Tab = (typeof tabs)[number][0];

const statusInfo: Record<string, { label: string; cls: string }> = {
    pending: { label: 'Menunggu', cls: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200' },
    approved: { label: 'Disetujui', cls: 'bg-green-100 text-green-800 ring-1 ring-green-200' },
    rejected: { label: 'Ditolak', cls: 'bg-red-100 text-red-800 ring-1 ring-red-200' },
    cancelled: { label: 'Dibatalkan', cls: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200' },
};

const fmtDate = (s: string) =>
    s ? new Date(`${s.slice(0, 10)}T00:00:00`).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '–';

function StatusPill({ value }: { value: string }) {
    const info = statusInfo[value];

    return (
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${info?.cls ?? 'bg-muted text-foreground ring-1 ring-border'}`}>
            {info?.label ?? value}
        </span>
    );
}

function Row({ r }: { r: LeaveRequest }) {
    const [notes, setNotes] = useState('');
    const [busy, setBusy] = useState(false);
    const [batalMode, setBatalMode] = useState(false);
    const [alasan, setAlasan] = useState('');
    const [errBatal, setErrBatal] = useState<string>();

    const review = (status: 'approved' | 'rejected') =>
        router.patch(
            `/admin/izin/${r.id}`,
            { status, review_notes: notes },
            { preserveScroll: true, onStart: () => setBusy(true), onFinish: () => setBusy(false) },
        );

    const batalkan = () =>
        router.patch(
            `/admin/izin/${r.id}/batalkan`,
            { cancel_reason: alasan },
            {
                preserveScroll: true,
                onStart: () => {
                    setBusy(true);
                    setErrBatal(undefined);
                },
                onError: (e) => setErrBatal(e.cancel_reason),
                onFinish: () => setBusy(false),
            },
        );

    return (
        <li className="space-y-3 rounded-xl border p-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{r.user?.name}</span>
                <Badge value={r.type} />
                <StatusPill value={r.status} />
                <span className="text-muted-foreground tabular-nums">
                    {fmtDate(r.start_date)} s.d. {fmtDate(r.end_date)}
                </span>

                {r.proof_file && (
                    <a
                        href={`/berkas/izin/${r.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className={`ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition hover:bg-muted ${focusRing}`}
                    >
                        <FileText className="size-3.5" />
                        Lihat bukti
                    </a>
                )}
            </div>

            <p className="text-muted-foreground">{r.reason}</p>

            {r.status === 'pending' && (
                <div className="flex flex-wrap items-center gap-2">
                    <input
                        className={`${fieldCls} max-w-xs`}
                        placeholder="Catatan (opsional)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />

                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => review('approved')}
                        className={`inline-flex h-10 items-center gap-1.5 rounded-xl bg-green-600 px-4 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50 ${focusRing}`}
                    >
                        <Check className="size-4" />
                        Setujui
                    </button>

                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => review('rejected')}
                        className={`inline-flex h-10 items-center gap-1.5 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50 ${focusRing}`}
                    >
                        <X className="size-4" />
                        Tolak
                    </button>
                </div>
            )}

            {r.status !== 'pending' && r.review_notes && (
                <p className="text-xs text-muted-foreground">Catatan: {r.review_notes}</p>
            )}

            {r.status === 'cancelled' && (
                <p className="text-xs text-muted-foreground">
                    {r.cancel_reason ? `Dibatalkan admin: ${r.cancel_reason}` : 'Dibatalkan oleh peserta.'}
                </p>
            )}

            {r.status === 'approved' &&
                (batalMode ? (
                    <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                        <p className="text-xs text-amber-900">
                            Baris absensi izin/sakit dari pengajuan ini akan dihapus. Hari kerja yang sudah lewat dan tidak punya catatan
                            absen akan dihitung <b>alpha</b>.
                        </p>

                        <input
                            className={fieldCls}
                            placeholder="Alasan pembatalan (wajib)"
                            value={alasan}
                            onChange={(e) => setAlasan(e.target.value)}
                        />

                        {errBatal && <p className="text-xs text-red-600">{errBatal}</p>}

                        <div className="flex gap-2">
                            <button
                                type="button"
                                disabled={busy}
                                onClick={batalkan}
                                className={`inline-flex h-9 items-center rounded-lg bg-red-600 px-4 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50 ${focusRing}`}
                            >
                                {busy ? 'Membatalkan…' : 'Ya, batalkan persetujuan'}
                            </button>

                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => {
                                    setBatalMode(false);
                                    setErrBatal(undefined);
                                }}
                                className={`inline-flex h-9 items-center rounded-lg border px-4 text-xs font-medium transition hover:bg-muted ${focusRing}`}
                            >
                                Tidak jadi
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setBatalMode(true)}
                        className={`inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-xs font-medium text-red-700 transition hover:bg-red-50 ${focusRing}`}
                    >
                        <RotateCcw className="size-3.5" />
                        Batalkan persetujuan
                    </button>
                ))}
        </li>
    );
}

export default function AdminIzin({ requests }: { requests: LeaveRequest[] }) {
    const [tab, setTab] = useState<Tab>('semua');
    const [q, setQ] = useState('');

    const pending = requests.filter((r) => r.status === 'pending').length;

    const filtered = useMemo(() => {
        const key = q.trim().toLowerCase();

        return requests.filter((r) => {
            const cocokTab = tab === 'semua' || r.status === tab;
            const cocokCari =
                !key || (r.user?.name ?? '').toLowerCase().includes(key) || (r.reason ?? '').toLowerCase().includes(key);

            return cocokTab && cocokCari;
        });
    }, [requests, tab, q]);

    return (
        <SiamLayout title="Persetujuan Izin/Sakit">
            <div className="@container space-y-5">
                <PageHeader
                    title="Izin / Sakit"
                    subtitle={`${requests.length} pengajuan · ${pending} menunggu persetujuan`}
                />

                <Panel>
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                        <div className="inline-flex flex-wrap rounded-xl bg-muted p-1">
                            {tabs.map(([key, label]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setTab(key)}
                                    className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${focusRing} ${
                                        tab === key
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        <SearchBox value={q} onChange={setQ} placeholder="Cari nama atau alasan" />
                    </div>

                    {filtered.length === 0 ? (
                        <p className="py-10 text-center text-sm text-muted-foreground">
                            {requests.length === 0 ? 'Belum ada pengajuan.' : 'Tidak ada pengajuan yang cocok.'}
                        </p>
                    ) : (
                        <ul className="space-y-3">
                            {filtered.map((r) => (
                                <Row key={r.id} r={r} />
                            ))}
                        </ul>
                    )}
                </Panel>
            </div>
        </SiamLayout>
    );
}