import SiamLayout from '@/components/siam/layout';
import { Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Download, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

type Row = {
    id: number;
    name: string;
    email: string;
    instansi: string | null;
    location: string | null;
    division: string | null;
    workdays: number;
    efektif: number;
    hadir: number;
    terlambat: number;
    izin: number;
    sakit: number;
    alpha: number;
    persen: number;
};

type Props = {
    month: string;
    prev: string;
    next: string | null;
    filters: { lokasi: string | number | null; divisi: string | number | null };
    rows: Row[];
    locations: { id: number; name: string }[];
    divisions: { id: number; name: string; location_id: number | null }[];
};

const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-ring/60';
const fieldClass = `h-10 rounded-xl border bg-background px-3 text-sm ${focusRing}`;

const barColor = (p: number) => (p >= 80 ? 'bg-green-500' : p >= 50 ? 'bg-amber-500' : 'bg-red-500');

const monthLabel = (m: string) =>
    new Date(`${m}-01T00:00:00`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

export default function RekapIndex({ month, prev, next, filters, rows, locations, divisions }: Props) {
    const [q, setQ] = useState('');

    // Susun URL dengan query string yang bersih
    const url = (path: string, patch: Record<string, string | null> = {}) => {
        const params: Record<string, string> = {};
        const merged: Record<string, string | number | null | undefined> = {
            bulan: month,
            lokasi: filters.lokasi,
            divisi: filters.divisi,
            ...patch,
        };

        Object.entries(merged).forEach(([k, v]) => {
            if (v !== null && v !== undefined && v !== '') params[k] = String(v);
        });

        const qs = new URLSearchParams(params).toString();

        return qs ? `${path}?${qs}` : path;
    };

    const go = (patch: Record<string, string | null>) => {
        // Ganti lokasi: reset divisi karena divisi terikat lokasi
        if ('lokasi' in patch) patch.divisi = null;

        router.get(url('/admin/rekap', patch), {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const divisionOptions = useMemo(
        () => (filters.lokasi ? divisions.filter((d) => String(d.location_id) === String(filters.lokasi)) : divisions),
        [divisions, filters.lokasi],
    );

    const visible = useMemo(() => {
        const key = q.trim().toLowerCase();

        if (!key) return rows;

        return rows.filter((r) =>
            [r.name, r.email, r.instansi].filter(Boolean).some((v) => (v as string).toLowerCase().includes(key)),
        );
    }, [rows, q]);

    const total = useMemo(
        () =>
            visible.reduce(
                (t, r) => ({
                    workdays: t.workdays + r.workdays,
                    efektif: t.efektif + r.efektif,
                    hadir: t.hadir + r.hadir,
                    terlambat: t.terlambat + r.terlambat,
                    izin: t.izin + r.izin,
                    sakit: t.sakit + r.sakit,
                    alpha: t.alpha + r.alpha,
                }),
                { workdays: 0, efektif: 0, hadir: 0, terlambat: 0, izin: 0, sakit: 0, alpha: 0 },
            ),
        [visible],
    );

    // Rumus total sama dengan per peserta: (hadir + terlambat) / hari efektif
    const totalPersen = total.efektif
        ? Math.min(100, Math.round(((total.hadir + total.terlambat) / total.efektif) * 100))
        : 0;

    return (
        <SiamLayout title="Rekap Bulanan">
            <div className="@container space-y-5">
                {/* HEADER */}
                <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm @3xl:flex-row @3xl:items-center @3xl:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Rekap Bulanan</h1>
                        <p className="mt-1 text-sm text-muted-foreground">{rows.length} peserta aktif pada bulan ini</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href={url('/admin/rekap', { bulan: prev })}
                            className={`inline-flex size-10 items-center justify-center rounded-xl border transition hover:bg-muted ${focusRing}`}
                            aria-label="Bulan sebelumnya"
                        >
                            <ChevronLeft className="size-4" />
                        </Link>

                        <span className="min-w-36 text-center text-sm font-semibold capitalize">{monthLabel(month)}</span>

                        {next ? (
                            <Link
                                href={url('/admin/rekap', { bulan: next })}
                                className={`inline-flex size-10 items-center justify-center rounded-xl border transition hover:bg-muted ${focusRing}`}
                                aria-label="Bulan berikutnya"
                            >
                                <ChevronRight className="size-4" />
                            </Link>
                        ) : (
                            <span className="inline-flex size-10 items-center justify-center rounded-xl border opacity-50">
                                <ChevronRight className="size-4" />
                            </span>
                        )}

                        {/* Unduhan memakai <a>, bukan Link Inertia */}
                        <a
                            href={url('/admin/rekap/export')}
                            className={`inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 ${focusRing}`}
                        >
                            <Download className="size-4" />
                            Unduh Excel
                        </a>
                    </div>
                </div>

                {/* TABEL */}
                <div className="min-w-0 rounded-2xl border bg-card p-5 shadow-sm">
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                        <select
                            value={filters.lokasi ?? ''}
                            onChange={(e) => go({ lokasi: e.target.value })}
                            className={fieldClass}
                        >
                            <option value="">Semua lokasi</option>
                            {locations.map((l) => (
                                <option key={l.id} value={l.id}>
                                    {l.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filters.divisi ?? ''}
                            onChange={(e) => go({ divisi: e.target.value })}
                            className={fieldClass}
                        >
                            <option value="">Semua divisi</option>
                            {divisionOptions.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.name}
                                </option>
                            ))}
                        </select>

                        <div className="relative w-full @3xl:ml-auto @3xl:w-80">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="search"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Cari nama, email, sekolah"
                                className={`h-10 w-full rounded-xl border bg-background pr-3 pl-9 text-sm ${focusRing}`}
                            />
                        </div>
                    </div>

                    {visible.length === 0 ? (
                        <p className="py-10 text-center text-sm text-muted-foreground">Tidak ada data.</p>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b text-muted-foreground">
                                        <tr>
                                            <th className="w-12 pb-3 font-medium">No</th>
                                            <th className="pb-3 font-medium">Peserta</th>
                                            <th className="px-3 pb-3 font-medium">Penempatan</th>
                                            <th className="px-3 pb-3 text-right font-medium">Hari kerja</th>
                                            <th className="px-3 pb-3 text-right font-medium">Hari efektif</th>
                                            <th className="px-3 pb-3 text-right font-medium">Hadir</th>
                                            <th className="px-3 pb-3 text-right font-medium">Terlambat</th>
                                            <th className="px-3 pb-3 text-right font-medium">Izin</th>
                                            <th className="px-3 pb-3 text-right font-medium">Sakit</th>
                                            <th className="px-3 pb-3 text-right font-medium">Alpha</th>
                                            <th className="px-3 pb-3 font-medium">Kehadiran</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y">
                                        {visible.map((r, i) => (
                                            <tr key={r.id} className="transition hover:bg-muted/50">
                                                <td className="py-3 pr-2 text-muted-foreground tabular-nums">{i + 1}</td>

                                                <td className="py-3 pr-3">
                                                    <p className="font-medium">{r.name}</p>
                                                    <p className="text-xs text-muted-foreground">{r.email}</p>
                                                </td>

                                                <td className="px-3 py-3">
                                                    <p>{r.location ?? '–'}</p>
                                                    {r.division && <p className="text-xs text-muted-foreground">{r.division}</p>}
                                                </td>

                                                <td className="px-3 py-3 text-right tabular-nums">{r.workdays}</td>
                                                <td className="px-3 py-3 text-right tabular-nums">{r.efektif}</td>
                                                <td className="px-3 py-3 text-right tabular-nums">{r.hadir}</td>
                                                <td className="px-3 py-3 text-right tabular-nums">{r.terlambat}</td>
                                                <td className="px-3 py-3 text-right tabular-nums">{r.izin}</td>
                                                <td className="px-3 py-3 text-right tabular-nums">{r.sakit}</td>
                                                <td
                                                    className={`px-3 py-3 text-right tabular-nums ${r.alpha > 0 ? 'font-semibold text-red-700' : ''}`}
                                                >
                                                    {r.alpha}
                                                </td>

                                                <td className="px-3 py-3">
                                                    <div className="flex min-w-28 items-center gap-2">
                                                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                                            <div
                                                                className={`h-full rounded-full ${barColor(r.persen)}`}
                                                                style={{ width: `${r.persen}%` }}
                                                            />
                                                        </div>
                                                        <span className="w-10 text-right text-xs font-medium tabular-nums">
                                                            {r.persen}%
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>

                                    <tfoot className="border-t-2 font-semibold">
                                        <tr>
                                            <td className="py-3" colSpan={3}>
                                                Total ({visible.length} peserta)
                                            </td>
                                            <td className="px-3 py-3 text-right tabular-nums">{total.workdays}</td>
                                            <td className="px-3 py-3 text-right tabular-nums">{total.efektif}</td>
                                            <td className="px-3 py-3 text-right tabular-nums">{total.hadir}</td>
                                            <td className="px-3 py-3 text-right tabular-nums">{total.terlambat}</td>
                                            <td className="px-3 py-3 text-right tabular-nums">{total.izin}</td>
                                            <td className="px-3 py-3 text-right tabular-nums">{total.sakit}</td>
                                            <td className="px-3 py-3 text-right tabular-nums">{total.alpha}</td>
                                            <td className="px-3 py-3 tabular-nums">{totalPersen}%</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            <p className="mt-4 text-xs text-muted-foreground">
                                Hari efektif = Hari kerja − Izin − Sakit. Kehadiran = (Hadir + Terlambat) ÷ Hari efektif.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </SiamLayout>
    );
}