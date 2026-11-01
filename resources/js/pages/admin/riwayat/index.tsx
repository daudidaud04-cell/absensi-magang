import SiamLayout from '@/components/siam/layout';
import { Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Flag } from 'lucide-react';
import { useMemo } from 'react';

// ======================================================
// TYPES
// ======================================================

type Row = {
    id: number;
    date: string;
    name: string | null;
    email: string | null;
    location: string | null;
    division: string | null;
    time_in: string | null;
    time_out: string | null;
    status: string;
    source: string;
    logbook: string | null;
    is_flagged: boolean;
    flag_notes: string | null;
};

type Paginator = {
    data: Row[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

type Filters = {
    dari: string;
    sampai: string;
    peserta: string | number | null;
    lokasi: string | number | null;
    divisi: string | number | null;
    status: string | null;
    flag: boolean;
};

type Props = {
    rows: Paginator;
    filters: Filters;
    counts: Record<string, number>;
    statuses: string[];
    pesertas: { id: number; name: string }[];
    locations: { id: number; name: string }[];
    divisions: { id: number; name: string; location_id: number | null }[];
};

// ======================================================
// KONSTANTA & HELPERS
// ======================================================

const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-ring/60';

const statusBadge: Record<string, string> = {
    hadir: 'bg-green-100 text-green-800 ring-1 ring-green-200',
    terlambat: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200',
    izin: 'bg-blue-100 text-blue-800 ring-1 ring-blue-200',
    sakit: 'bg-purple-100 text-purple-800 ring-1 ring-purple-200',
    alpha: 'bg-red-100 text-red-800 ring-1 ring-red-200',
};

const fmtDate = (s: string) =>
    new Date(`${s}T00:00:00`).toLocaleDateString('id-ID', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

const fieldClass = `h-10 w-full rounded-xl border bg-background px-3 text-sm ${focusRing}`;

// ======================================================
// HALAMAN
// ======================================================

export default function RiwayatIndex({ rows, filters, counts, statuses, pesertas, locations, divisions }: Props) {
    // Kirim filter ke server. Nilai kosong dibuang supaya URL tetap bersih.
    const apply = (patch: Partial<Record<keyof Filters, string | boolean | null>>) => {
        const next: Record<string, string | boolean | null | number | undefined> = { ...filters, ...patch };

        // Ganti lokasi: reset divisi karena divisi terikat lokasi
        if ('lokasi' in patch) next.divisi = null;

        const clean = Object.fromEntries(
            Object.entries(next).filter(([, v]) => v !== null && v !== '' && v !== false),
        );

        router.get('/admin/riwayat', clean, { preserveState: true, preserveScroll: true, replace: true });
    };

    const divisionOptions = useMemo(
        () => (filters.lokasi ? divisions.filter((d) => String(d.location_id) === String(filters.lokasi)) : divisions),
        [divisions, filters.lokasi],
    );

    const start = rows.from ?? 0;

    return (
        <SiamLayout title="Riwayat Absensi">
            <div className="@container space-y-5">
                {/* HEADER */}
                <div className="rounded-2xl border bg-card p-5 shadow-sm">
                    <h1 className="text-2xl font-bold tracking-tight">Riwayat Absensi</h1>

                    <p className="mt-1 text-sm text-muted-foreground">{rows.total} catatan pada filter ini</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {statuses.map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => apply({ status: filters.status === s ? null : s })}
                                className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition ${focusRing} ${
                                    statusBadge[s]
                                } ${filters.status === s ? 'ring-2 ring-primary' : ''}`}
                            >
                                {s}: {counts[s] ?? 0}
                            </button>
                        ))}
                    </div>
                </div>

                {/* FILTER */}
                <div className="rounded-2xl border bg-card p-5 shadow-sm">
                    <div className="grid gap-3 @2xl:grid-cols-3 @5xl:grid-cols-6">
                        <label className="space-y-1 text-xs text-muted-foreground">
                            Dari tanggal
                            <input
                                type="date"
                                value={filters.dari}
                                onChange={(e) => apply({ dari: e.target.value })}
                                className={fieldClass}
                            />
                        </label>

                        <label className="space-y-1 text-xs text-muted-foreground">
                            Sampai tanggal
                            <input
                                type="date"
                                value={filters.sampai}
                                onChange={(e) => apply({ sampai: e.target.value })}
                                className={fieldClass}
                            />
                        </label>

                        <label className="space-y-1 text-xs text-muted-foreground">
                            Peserta
                            <select
                                value={filters.peserta ?? ''}
                                onChange={(e) => apply({ peserta: e.target.value })}
                                className={fieldClass}
                            >
                                <option value="">Semua peserta</option>
                                {pesertas.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="space-y-1 text-xs text-muted-foreground">
                            Lokasi
                            <select
                                value={filters.lokasi ?? ''}
                                onChange={(e) => apply({ lokasi: e.target.value })}
                                className={fieldClass}
                            >
                                <option value="">Semua lokasi</option>
                                {locations.map((l) => (
                                    <option key={l.id} value={l.id}>
                                        {l.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="space-y-1 text-xs text-muted-foreground">
                            Divisi
                            <select
                                value={filters.divisi ?? ''}
                                onChange={(e) => apply({ divisi: e.target.value })}
                                className={fieldClass}
                            >
                                <option value="">Semua divisi</option>
                                {divisionOptions.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="space-y-1 text-xs text-muted-foreground">
                            Status
                            <select
                                value={filters.status ?? ''}
                                onChange={(e) => apply({ status: e.target.value })}
                                className={`${fieldClass} capitalize`}
                            >
                                <option value="">Semua status</option>
                                {statuses.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <label className="inline-flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={filters.flag}
                                onChange={(e) => apply({ flag: e.target.checked })}
                                className="size-4 rounded border"
                            />
                            Hanya yang ditandai mencurigakan
                        </label>

                        <Link
                            href="/admin/riwayat"
                            className={`inline-flex h-9 items-center rounded-lg border px-3 text-xs font-medium transition hover:bg-muted ${focusRing}`}
                        >
                            Reset filter
                        </Link>
                    </div>
                </div>

                {/* TABEL */}
                <div className="min-w-0 rounded-2xl border bg-card p-5 shadow-sm">
                    {rows.data.length === 0 ? (
                        <p className="py-10 text-center text-sm text-muted-foreground">Tidak ada data.</p>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b text-muted-foreground">
                                        <tr>
                                            <th className="w-12 pb-3 font-medium">No</th>
                                            <th className="px-3 pb-3 font-medium">Tanggal</th>
                                            <th className="px-3 pb-3 font-medium">Peserta</th>
                                            <th className="px-3 pb-3 font-medium">Penempatan</th>
                                            <th className="px-3 pb-3 font-medium">Masuk</th>
                                            <th className="px-3 pb-3 font-medium">Pulang</th>
                                            <th className="px-3 pb-3 font-medium">Status</th>
                                            <th className="px-3 pb-3 font-medium">Sumber</th>
                                            <th className="pb-3 font-medium">Catatan</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y">
                                        {rows.data.map((r, i) => (
                                            <tr key={r.id} className="align-top transition hover:bg-muted/50">
                                                <td className="py-3 pr-2 text-muted-foreground tabular-nums">
                                                    {start + i}
                                                </td>

                                                <td className="px-3 py-3 whitespace-nowrap">{fmtDate(r.date)}</td>

                                                <td className="px-3 py-3">
                                                    <p className="font-medium">{r.name ?? '–'}</p>
                                                    <p className="text-xs text-muted-foreground">{r.email}</p>
                                                </td>

                                                <td className="px-3 py-3">
                                                    <p>{r.location ?? '–'}</p>
                                                    {r.division && (
                                                        <p className="text-xs text-muted-foreground">{r.division}</p>
                                                    )}
                                                </td>

                                                <td className="px-3 py-3 tabular-nums">{r.time_in ?? '–'}</td>

                                                <td className="px-3 py-3 tabular-nums">{r.time_out ?? '–'}</td>

                                                <td className="px-3 py-3">
                                                    <span
                                                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadge[r.status] ?? 'bg-muted'}`}
                                                    >
                                                        {r.status}
                                                    </span>
                                                </td>

                                                <td className="px-3 py-3 text-xs text-muted-foreground capitalize">
                                                    {r.source === 'sistem' ? 'Sistem' : r.source === 'manual' ? 'Manual (admin)' : 'Mandiri'}
                                                </td>

                                                <td className="max-w-64 py-3">
                                                    {r.is_flagged && (
                                                        <p className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-red-700">
                                                            <Flag className="size-3.5" />
                                                            Mencurigakan{r.flag_notes ? `: ${r.flag_notes}` : ''}
                                                        </p>
                                                    )}

                                                    {r.logbook && (
                                                        <p className="line-clamp-2 text-xs text-muted-foreground">
                                                            {r.logbook}
                                                        </p>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Paginasi */}
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm">
                                <p className="text-muted-foreground">
                                    Menampilkan {rows.from}–{rows.to} dari {rows.total} catatan
                                </p>

                                {rows.last_page > 1 && (
                                    <div className="flex items-center gap-2">
                                        {rows.prev_page_url ? (
                                            <Link
                                                href={rows.prev_page_url}
                                                preserveScroll
                                                className={`inline-flex h-9 items-center gap-1 rounded-lg border px-3 font-medium transition hover:bg-muted ${focusRing}`}
                                            >
                                                <ChevronLeft className="size-4" />
                                                Sebelumnya
                                            </Link>
                                        ) : (
                                            <span className="inline-flex h-9 items-center gap-1 rounded-lg border px-3 font-medium opacity-50">
                                                <ChevronLeft className="size-4" />
                                                Sebelumnya
                                            </span>
                                        )}

                                        <span className="px-2 text-muted-foreground tabular-nums">
                                            {rows.current_page} / {rows.last_page}
                                        </span>

                                        {rows.next_page_url ? (
                                            <Link
                                                href={rows.next_page_url}
                                                preserveScroll
                                                className={`inline-flex h-9 items-center gap-1 rounded-lg border px-3 font-medium transition hover:bg-muted ${focusRing}`}
                                            >
                                                Berikutnya
                                                <ChevronRight className="size-4" />
                                            </Link>
                                        ) : (
                                            <span className="inline-flex h-9 items-center gap-1 rounded-lg border px-3 font-medium opacity-50">
                                                Berikutnya
                                                <ChevronRight className="size-4" />
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </SiamLayout>
    );
}