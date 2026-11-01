import SiamLayout from '@/components/siam/layout';
import { fieldCls, focusRing, PageHeader, Panel, SearchBox } from '@/components/siam/kit';
import type { LeaveRequest } from '@/components/siam/types';
import { Badge } from '@/components/siam/ui';
import { router } from '@inertiajs/react';
import { Check, FileText, X } from 'lucide-react';
import { useMemo, useState } from 'react';

const tabs = [
    ['semua', 'Semua'],
    ['pending', 'Menunggu'],
    ['approved', 'Disetujui'],
    ['rejected', 'Ditolak'],
] as const;

type Tab = (typeof tabs)[number][0];

const fmtDate = (s: string) =>
    s ? new Date(`${s.slice(0, 10)}T00:00:00`).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '–';

function Row({ r }: { r: LeaveRequest }) {
    const [notes, setNotes] = useState('');
    const [busy, setBusy] = useState(false);

    const review = (status: 'approved' | 'rejected') =>
        router.patch(
            `/admin/izin/${r.id}`,
            { status, review_notes: notes },
            { preserveScroll: true, onStart: () => setBusy(true), onFinish: () => setBusy(false) },
        );

    return (
        <li className="space-y-3 rounded-xl border p-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{r.user?.name}</span>
                <Badge value={r.type} />
                <Badge value={r.status} />
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

            {r.status === 'pending' ? (
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
            ) : (
                r.review_notes && <p className="text-xs text-muted-foreground">Catatan: {r.review_notes}</p>
            )}
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
                        <div className="inline-flex rounded-xl bg-muted p-1">
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