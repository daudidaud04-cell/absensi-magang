import SiamLayout from '@/components/siam/layout';
import { fieldCls, focusRing, PageHeader, Panel, rowBtn } from '@/components/siam/kit';
import { Link, router } from '@inertiajs/react';
import { ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';

type Log = {
    id: number;
    waktu: string;
    admin: string;
    action: string;
    description: string;
    subject_label: string | null;
    properties: Record<string, unknown> | null;
    ip: string | null;
};

type Paginator = {
    data: Log[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
    prev_page_url: string | null;
    next_page_url: string | null;
};

type Filters = {
    q: string;
    aksi: string;
    admin: string | number;
    dari: string;
    sampai: string;
};

type Props = {
    logs: Paginator;
    filters: Filters;
    admins: { id: number; name: string }[];
    kelompok: [string, string][];
};

const kosong: Filters = { q: '', aksi: '', admin: '', dari: '', sampai: '' };

const fmtWaktu = (s: string) =>
    new Date(s.replace(' ', 'T')).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

const tampil = (v: unknown): string => {
    if (v === null || v === undefined || v === '') {
        return '–';
    }

    if (typeof v === 'boolean') {
        return v ? 'ya' : 'tidak';
    }

    return typeof v === 'object' ? JSON.stringify(v) : String(v);
};

const isDiff = (v: unknown): v is { dari: unknown; menjadi: unknown } =>
    typeof v === 'object' && v !== null && 'dari' in v && 'menjadi' in v;

function aksiStyle(action: string) {
    if (/dihapus|dibatalkan|ditolak/.test(action)) {
        return 'bg-red-100 text-red-800 ring-1 ring-red-200';
    }

    if (/dibuat|dicatat|disetujui/.test(action)) {
        return 'bg-green-100 text-green-800 ring-1 ring-green-200';
    }

    return 'bg-blue-100 text-blue-800 ring-1 ring-blue-200';
}

function Rincian({ log }: { log: Log }) {
    const props = log.properties ? Object.entries(log.properties) : [];

    return (
        <div className="space-y-2 rounded-xl bg-muted/40 p-3 text-xs">
            {log.subject_label && (
                <p>
                    <span className="text-muted-foreground">Objek: </span>
                    <span className="font-medium">{log.subject_label}</span>
                </p>
            )}

            {props.length === 0 ? (
                <p className="text-muted-foreground">Tidak ada rincian tambahan.</p>
            ) : (
                <dl className="grid gap-x-4 gap-y-1.5 sm:grid-cols-[max-content_1fr]">
                    {props.map(([k, v]) => (
                        <div key={k} className="contents">
                            <dt className="text-muted-foreground">{k.replace(/_/g, ' ')}</dt>
                            <dd className="font-medium break-words">
                                {isDiff(v) ? (
                                    <>
                                        <span className="text-red-700 line-through decoration-red-300">{tampil(v.dari)}</span>
                                        <span className="mx-1.5 text-muted-foreground">→</span>
                                        <span className="text-green-700">{tampil(v.menjadi)}</span>
                                    </>
                                ) : (
                                    tampil(v)
                                )}
                            </dd>
                        </div>
                    ))}
                </dl>
            )}

            {log.ip && <p className="text-muted-foreground">IP: {log.ip}</p>}
        </div>
    );
}

export default function AdminLog({ logs, filters, admins, kelompok }: Props) {
    const [f, setF] = useState<Filters>({ ...kosong, ...filters });
    const [buka, setBuka] = useState<number | null>(null);

    const set = (k: keyof Filters, v: string) => setF((s) => ({ ...s, [k]: v }));

    const terapkan = (e?: FormEvent) => {
        e?.preventDefault();

        const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== '' && v !== null));

        router.get('/admin/log', params, { preserveScroll: true, preserveState: true });
    };

    const reset = () => {
        setF(kosong);
        router.get('/admin/log', {}, { preserveScroll: true });
    };

    return (
        <SiamLayout title="Log Aktivitas">
            <div className="@container space-y-5">
                <PageHeader
                    title="Log Aktivitas"
                    subtitle={`${logs.total} catatan aktivitas admin. Catatan tidak dapat diubah atau dihapus.`}
                />

                <Panel>
                    <form onSubmit={terapkan} className="mb-4 grid gap-3 sm:grid-cols-2 @3xl:grid-cols-6">
                        <div className="relative sm:col-span-2 @3xl:col-span-2">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="search"
                                value={f.q}
                                onChange={(e) => set('q', e.target.value)}
                                placeholder="Cari nama atau keterangan"
                                className={`h-10 w-full rounded-xl border bg-background pr-3 pl-9 text-sm ${focusRing}`}
                            />
                        </div>

                        <select value={f.aksi} onChange={(e) => set('aksi', e.target.value)} className={fieldCls}>
                            <option value="">Semua aksi</option>
                            {kelompok.map(([key, label]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>

                        <select value={f.admin} onChange={(e) => set('admin', e.target.value)} className={fieldCls}>
                            <option value="">Semua admin</option>
                            {admins.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.name}
                                </option>
                            ))}
                        </select>

                        <input
                            type="date"
                            value={f.dari}
                            onChange={(e) => set('dari', e.target.value)}
                            aria-label="Dari tanggal"
                            className={fieldCls}
                        />

                        <input
                            type="date"
                            value={f.sampai}
                            onChange={(e) => set('sampai', e.target.value)}
                            aria-label="Sampai tanggal"
                            className={fieldCls}
                        />

                        <div className="flex gap-2 sm:col-span-2 @3xl:col-span-6">
                            <button
                                type="submit"
                                className={`inline-flex h-9 items-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 ${focusRing}`}
                            >
                                Terapkan
                            </button>

                            <button type="button" onClick={reset} className={rowBtn}>
                                Reset
                            </button>
                        </div>
                    </form>

                    {logs.data.length === 0 ? (
                        <p className="py-10 text-center text-sm text-muted-foreground">Belum ada catatan aktivitas.</p>
                    ) : (
                        <ul className="divide-y rounded-xl border">
                            {logs.data.map((l) => {
                                const terbuka = buka === l.id;

                                return (
                                    <li key={l.id} className="p-3 text-sm">
                                        <button
                                            type="button"
                                            onClick={() => setBuka(terbuka ? null : l.id)}
                                            aria-expanded={terbuka}
                                            className={`flex w-full items-start gap-3 rounded-lg text-left ${focusRing}`}
                                        >
                                            <div className="min-w-0 flex-1 space-y-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span
                                                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${aksiStyle(l.action)}`}
                                                    >
                                                        {l.action.replace('.', ' · ').replace(/_/g, ' ')}
                                                    </span>

                                                    <span className="text-xs text-muted-foreground tabular-nums">
                                                        {fmtWaktu(l.waktu)}
                                                    </span>
                                                </div>

                                                <p className="font-medium break-words">{l.description}</p>

                                                <p className="text-xs text-muted-foreground">Oleh {l.admin}</p>
                                            </div>

                                            <ChevronDown
                                                className={`mt-1 size-4 shrink-0 text-muted-foreground transition ${terbuka ? 'rotate-180' : ''}`}
                                            />
                                        </button>

                                        {terbuka && (
                                            <div className="mt-3">
                                                <Rincian log={l} />
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm">
                        <p className="text-muted-foreground">
                            {logs.total === 0 ? '0 catatan' : `Menampilkan ${logs.from}–${logs.to} dari ${logs.total} catatan`}
                        </p>

                        {logs.last_page > 1 && (
                            <div className="flex items-center gap-2">
                                {logs.prev_page_url ? (
                                    <Link href={logs.prev_page_url} preserveScroll className={rowBtn}>
                                        <ChevronLeft className="size-4" />
                                        Sebelumnya
                                    </Link>
                                ) : (
                                    <span className={`${rowBtn} cursor-not-allowed opacity-50`}>
                                        <ChevronLeft className="size-4" />
                                        Sebelumnya
                                    </span>
                                )}

                                <span className="px-2 text-muted-foreground tabular-nums">
                                    {logs.current_page} / {logs.last_page}
                                </span>

                                {logs.next_page_url ? (
                                    <Link href={logs.next_page_url} preserveScroll className={rowBtn}>
                                        Berikutnya
                                        <ChevronRight className="size-4" />
                                    </Link>
                                ) : (
                                    <span className={`${rowBtn} cursor-not-allowed opacity-50`}>
                                        Berikutnya
                                        <ChevronRight className="size-4" />
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </Panel>
            </div>
        </SiamLayout>
    );
}