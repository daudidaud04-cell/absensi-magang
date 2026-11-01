import SiamLayout from '@/components/siam/layout';
import { Link, router } from '@inertiajs/react';
import { CalendarDays, ChevronLeft, ChevronRight, Download, List, Pencil, Plus, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// ======================================================
// TYPES
// ======================================================

type Peserta = {
    id: number;
    name: string;
    email: string;
    instansi: string | null;
    education_level: string | null;
    location: string | null;
    division: string | null;
    start_date: string | null;
    end_date: string | null;
    status_magang: string;
    certificate_status: string;
    persen: number | null;
};

type Props = {
    pesertas: Peserta[];
    status: string;
    level: string;
};

type DetailRow = {
    tanggal: string;
    hari: string;
    jenis: string;
    status: string;
    masuk: string;
    pulang: string;
    catatan: string;
    bulan: string;
};

type AbsensiData = {
    nama: string;
    ringkasan: {
        hari_kerja: number;
        hadir: number;
        terlambat: number;
        izin: number;
        sakit: number;
        alpha: number;
        persen: number | null;
    };
    detail: DetailRow[];
};

// ======================================================
// KONSTANTA
// ======================================================

const PER_PAGE = 25;

const tabs = [
    ['aktif', 'Aktif'],
    ['alumni', 'Alumni'],
    ['semua', 'Semua'],
] as const;

const levels = [
    ['semua', 'Semua jenjang'],
    ['smk', 'SMK'],
    ['perguruan_tinggi', 'Perguruan Tinggi'],
] as const;

const levelLabel: Record<string, string> = {
    smk: 'SMK',
    sma: 'SMA',
    perguruan_tinggi: 'Perguruan Tinggi',
};

const statusBadge: Record<string, string> = {
    aktif: 'bg-green-100 text-green-800 ring-1 ring-green-200',
    alumni: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
    selesai: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
};

const certStyle: Record<string, string> = {
    belum_diberikan: 'border-slate-200 bg-slate-50 text-slate-700',
    siap_diambil: 'border-amber-200 bg-amber-50 text-amber-800',
    sudah_diserahkan: 'border-green-200 bg-green-50 text-green-800',
};

const jenisBadge: Record<string, string> = {
    hadir: 'bg-green-100 text-green-800 ring-1 ring-green-200',
    terlambat: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200',
    izin: 'bg-blue-100 text-blue-800 ring-1 ring-blue-200',
    sakit: 'bg-purple-100 text-purple-800 ring-1 ring-purple-200',
    alpha: 'bg-red-100 text-red-800 ring-1 ring-red-200',
};

// Warna sel kalender
const kalenderWarna: Record<string, string> = {
    hadir: 'bg-green-100 text-green-800 hover:bg-green-200',
    terlambat: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
    izin: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    sakit: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
    alpha: 'bg-red-200 text-red-900 hover:bg-red-300',
};

const jenisFilter = [
    ['semua', 'Semua'],
    ['hadir', 'Hadir'],
    ['alpha', 'Alpha'],
    ['izin', 'Izin'],
    ['sakit', 'Sakit'],
    ['terlambat', 'Terlambat'],
] as const;

const legenda = [
    ['hadir', 'Hadir'],
    ['terlambat', 'Terlambat'],
    ['izin', 'Izin'],
    ['sakit', 'Sakit'],
    ['alpha', 'Alpha'],
] as const;

const namaHari = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-ring/60';

// ======================================================
// HELPERS
// ======================================================

const fmtDate = (s: string | null) =>
    s ? new Date(`${s}T00:00:00`).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '–';

const fmtBulan = (b: string) =>
    new Date(`${b}-01T00:00:00`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

const barColor = (p: number) => (p >= 80 ? 'bg-green-500' : p >= 50 ? 'bg-amber-500' : 'bg-red-500');

// ======================================================
// KOMPONEN KECIL
// ======================================================

function StatusBadge({ value }: { value: string }) {
    return (
        <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap capitalize ${statusBadge[value] ?? 'bg-muted text-foreground ring-1 ring-border'}`}
        >
            {value}
        </span>
    );
}

function Avatar({ name }: { name: string }) {
    return (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {name.charAt(0).toUpperCase()}
        </span>
    );
}

// Bisa diklik: membuka detail kehadiran
function Kehadiran({ persen, onClick }: { persen: number | null; onClick: () => void }) {
    const nilai = persen ?? 0;

    return (
        <button
            type="button"
            onClick={onClick}
            title="Klik untuk melihat detail tanggal"
            className={`-m-1 flex w-full min-w-24 items-center gap-2 rounded-md p-1 text-left transition hover:bg-muted ${focusRing}`}
        >
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full ${barColor(nilai)}`} style={{ width: `${nilai}%` }} />
            </div>

            <span className="w-9 text-right text-xs font-medium tabular-nums underline decoration-dotted underline-offset-2">
                {persen === null ? '–' : `${persen}%`}
            </span>
        </button>
    );
}

function CertSelect({ p }: { p: Peserta }) {
    return (
        <select
            value={p.certificate_status}
            onChange={(e) =>
                router.patch(
                    `/admin/peserta/${p.id}/sertifikat`,
                    { certificate_status: e.target.value },
                    { preserveScroll: true },
                )
            }
            className={`h-9 rounded-lg border px-2.5 text-xs font-medium ${focusRing} ${certStyle[p.certificate_status] ?? certStyle.belum_diberikan}`}
        >
            <option value="belum_diberikan">Belum diberikan</option>
            <option value="siap_diambil">Siap diambil</option>
            <option value="sudah_diserahkan">Sudah diserahkan</option>
        </select>
    );
}

function EditButton({ id }: { id: number }) {
    return (
        <Link
            href={`/admin/peserta/${id}/edit`}
            className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition hover:bg-muted ${focusRing}`}
        >
            <Pencil className="size-3.5" />
            Edit
        </Link>
    );
}

// Unduh laporan satu peserta (link biasa, bukan Inertia, karena ini mengunduh file)
function DownloadButton({ id }: { id: number }) {
    return (
        <a
            href={`/admin/peserta/${id}/export`}
            title="Unduh laporan peserta (Excel)"
            aria-label="Unduh laporan peserta"
            className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition hover:bg-muted ${focusRing}`}
        >
            <Download className="size-3.5" />
        </a>
    );
}

// ======================================================
// MODAL DETAIL KEHADIRAN
// ======================================================

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
    return (
        <div className="rounded-xl border p-2.5 text-center">
            <p className={`text-lg font-bold tabular-nums ${tone ?? ''}`}>{value}</p>
            <p className="text-[11px] text-muted-foreground">{label}</p>
        </div>
    );
}

// Info satu tanggal (dipakai di tab Kalender)
function InfoHari({ d }: { d: DetailRow }) {
    return (
        <div className="rounded-xl border bg-muted/40 p-3">
            <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium">
                    {d.hari}, {fmtDate(d.tanggal)}
                </p>

                <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${jenisBadge[d.jenis] ?? ''}`}
                >
                    {d.status}
                </span>
            </div>

            {(d.masuk || d.pulang) && (
                <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                    Masuk {d.masuk || '–'} · Pulang {d.pulang || '–'}
                </p>
            )}

            {d.catatan && <p className="mt-0.5 text-xs text-muted-foreground">{d.catatan}</p>}
        </div>
    );
}

// Tab Kalender: satu bulan satu grid, mulai hari Senin
function KalenderView({ detail }: { detail: DetailRow[] }) {
    const daftarBulan = useMemo(
        () => Array.from(new Set(detail.map((d) => d.bulan))).sort().reverse(),
        [detail],
    );

    const [bulan, setBulan] = useState(daftarBulan[0] ?? '');
    const [dipilih, setDipilih] = useState<string | null>(null);

    const byDate = useMemo(() => new Map(detail.map((d) => [d.tanggal, d])), [detail]);

    if (!bulan) {
        return <p className="py-6 text-center text-sm text-muted-foreground">Belum ada data kehadiran.</p>;
    }

    const [y, m] = bulan.split('-').map(Number);
    const jumlahHari = new Date(y, m, 0).getDate();
    const offset = (new Date(y, m - 1, 1).getDay() + 6) % 7; // Senin = 0
    const hariIni = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD (waktu lokal)

    const sel: (number | null)[] = [
        ...Array.from({ length: offset }, () => null),
        ...Array.from({ length: jumlahHari }, (_, i) => i + 1),
    ];

    const idx = daftarBulan.indexOf(bulan);
    const info = dipilih ? byDate.get(dipilih) : undefined;

    const pindah = (b: string) => {
        setBulan(b);
        setDipilih(null);
    };

    return (
        <div className="space-y-3">
            {/* Pilih bulan */}
            <div className="flex items-center justify-between gap-2">
                <button
                    type="button"
                    onClick={() => pindah(daftarBulan[idx + 1])}
                    disabled={idx >= daftarBulan.length - 1}
                    aria-label="Bulan sebelumnya"
                    className={`rounded-lg border p-1.5 transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`}
                >
                    <ChevronLeft className="size-4" />
                </button>

                <select
                    value={bulan}
                    onChange={(e) => pindah(e.target.value)}
                    className={`h-8 rounded-lg border bg-background px-2 text-sm font-medium ${focusRing}`}
                >
                    {daftarBulan.map((b) => (
                        <option key={b} value={b}>
                            {fmtBulan(b)}
                        </option>
                    ))}
                </select>

                <button
                    type="button"
                    onClick={() => pindah(daftarBulan[idx - 1])}
                    disabled={idx <= 0}
                    aria-label="Bulan berikutnya"
                    className={`rounded-lg border p-1.5 transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`}
                >
                    <ChevronRight className="size-4" />
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-1.5">
                {namaHari.map((h) => (
                    <div key={h} className="pb-1 text-center text-[11px] font-medium text-muted-foreground">
                        {h}
                    </div>
                ))}

                {sel.map((tgl, i) => {
                    if (tgl === null) return <div key={`kosong-${i}`} />;

                    const key = `${bulan}-${String(tgl).padStart(2, '0')}`;
                    const d = byDate.get(key);
                    const aktif = dipilih === key;
                    const warna = d ? (kalenderWarna[d.jenis] ?? 'bg-muted') : 'bg-muted/60 text-muted-foreground';

                    return (
                        <button
                            key={key}
                            type="button"
                            disabled={!d}
                            onClick={() => setDipilih(aktif ? null : key)}
                            title={d ? `${d.hari}, ${fmtDate(key)}: ${d.status}` : 'Libur / di luar jadwal'}
                            className={`flex aspect-square items-center justify-center rounded-lg text-xs font-medium tabular-nums transition disabled:cursor-default ${warna} ${focusRing} ${
                                aktif ? 'ring-2 ring-foreground' : ''
                            } ${key === hariIni ? 'outline-2 outline-offset-1 outline-primary' : ''}`}
                        >
                            {tgl}
                        </button>
                    );
                })}
            </div>

            {/* Legenda */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                {legenda.map(([key, label]) => (
                    <span key={key} className="inline-flex items-center gap-1.5">
                        <span className={`size-3 rounded ${kalenderWarna[key].split(' ')[0]}`} />
                        {label}
                    </span>
                ))}
                <span className="inline-flex items-center gap-1.5">
                    <span className="size-3 rounded bg-muted" />
                    Libur / di luar jadwal
                </span>
            </div>

            {info ? (
                <InfoHari d={info} />
            ) : (
                <p className="text-xs text-muted-foreground">Klik tanggal berwarna untuk melihat jam masuk dan catatan.</p>
            )}
        </div>
    );
}

function DetailModal({ peserta, onClose }: { peserta: Peserta; onClose: () => void }) {
    const [data, setData] = useState<AbsensiData | null>(null);
    const [error, setError] = useState(false);
    const [tab, setTab] = useState<'daftar' | 'kalender'>('daftar');
    const [bulan, setBulan] = useState('semua');
    const [jenis, setJenis] = useState<(typeof jenisFilter)[number][0]>('semua');

    // Ambil data saat modal dibuka
    useEffect(() => {
        const ctrl = new AbortController();

        fetch(`/admin/peserta/${peserta.id}/absensi`, {
            headers: { Accept: 'application/json' },
            signal: ctrl.signal,
        })
            .then((r) => {
                if (!r.ok) throw new Error('gagal');
                return r.json();
            })
            .then(setData)
            .catch((e) => {
                if (e.name !== 'AbortError') setError(true);
            });

        return () => ctrl.abort();
    }, [peserta.id]);

    // Tutup dengan tombol Esc
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    // Semua hari yang punya status (hadir, terlambat, izin, sakit, alpha)
    const harian = useMemo(() => (data?.detail ?? []).filter((d) => d.jenis in jenisBadge), [data]);

    const daftarBulan = useMemo(() => Array.from(new Set(harian.map((d) => d.bulan))).sort().reverse(), [harian]);

    const rows = useMemo(
        () =>
            harian
                .filter((d) => (bulan === 'semua' || d.bulan === bulan) && (jenis === 'semua' || d.jenis === jenis))
                .slice()
                .reverse(), // terbaru di atas
        [harian, bulan, jenis],
    );

    const r = data?.ringkasan;

    const tabBtn = (key: 'daftar' | 'kalender', label: string, Icon: typeof List) => (
        <button
            type="button"
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${focusRing} ${
                tab === key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
        >
            <Icon className="size-3.5" />
            {label}
        </button>
    );

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
            onClick={onClose}
            role="presentation"
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={`Detail kehadiran ${peserta.name}`}
                onClick={(e) => e.stopPropagation()}
                className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-t-2xl border bg-card shadow-xl sm:rounded-2xl"
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 border-b p-5">
                    <div className="min-w-0">
                        <h2 className="text-lg font-bold tracking-tight">{peserta.name}</h2>
                        <p className="truncate text-xs text-muted-foreground">
                            {peserta.email} · {fmtDate(peserta.start_date)} s.d. {fmtDate(peserta.end_date)}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Tutup"
                        className={`rounded-lg border p-2 transition hover:bg-muted ${focusRing}`}
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Isi */}
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
                    {error && (
                        <p className="py-8 text-center text-sm text-red-600">
                            Gagal memuat data. Tutup lalu coba lagi.
                        </p>
                    )}

                    {!data && !error && <p className="py-8 text-center text-sm text-muted-foreground">Memuat data…</p>}

                    {data && r && (
                        <>
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                                <Stat label="Hari kerja" value={r.hari_kerja} />
                                <Stat label="Hadir" value={r.hadir} tone="text-green-600" />
                                <Stat label="Terlambat" value={r.terlambat} tone="text-amber-600" />
                                <Stat label="Izin" value={r.izin} tone="text-blue-600" />
                                <Stat label="Sakit" value={r.sakit} tone="text-purple-600" />
                                <Stat label="Alpha" value={r.alpha} tone="text-red-600" />
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Kehadiran {r.persen === null ? '–' : `${r.persen}%`}. Izin dan sakit tidak dihitung
                                sebagai pembagi. Hari kerja tanpa catatan absen dihitung alpha.
                            </p>

                            {/* Tab */}
                            <div className="inline-flex rounded-xl bg-muted p-1">
                                {tabBtn('daftar', 'Daftar', List)}
                                {tabBtn('kalender', 'Kalender', CalendarDays)}
                            </div>

                            {tab === 'kalender' ? (
                                <KalenderView detail={harian} />
                            ) : (
                                <>
                                    {/* Filter */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="inline-flex flex-wrap rounded-xl bg-muted p-1">
                                            {jenisFilter.map(([key, label]) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => setJenis(key)}
                                                    className={`rounded-lg px-3 py-1 text-xs font-medium transition ${focusRing} ${
                                                        jenis === key
                                                            ? 'bg-background text-foreground shadow-sm'
                                                            : 'text-muted-foreground hover:text-foreground'
                                                    }`}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>

                                        <select
                                            value={bulan}
                                            onChange={(e) => setBulan(e.target.value)}
                                            className={`h-8 rounded-lg border bg-background px-2 text-xs ${focusRing}`}
                                        >
                                            <option value="semua">Semua bulan</option>
                                            {daftarBulan.map((b) => (
                                                <option key={b} value={b}>
                                                    {fmtBulan(b)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Daftar tanggal */}
                                    {rows.length === 0 ? (
                                        <p className="py-6 text-center text-sm text-muted-foreground">
                                            Tidak ada catatan untuk filter ini.
                                        </p>
                                    ) : (
                                    <>
                                    <p className="text-xs text-muted-foreground">
                                        Total <span className="font-semibold text-foreground">{rows.length}</span> hari
                                        {jenis !== 'semua' && ` (${jenis})`}
                                    </p>

                                    <ul className="divide-y rounded-xl border">
                                        {rows.map((d, i) => (
                                            <li key={d.tanggal} className="flex items-start gap-3 p-3">
                                                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground tabular-nums">
                                                    {rows.length - i}
                                                </span>

                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium">
                                                        {d.hari}, {fmtDate(d.tanggal)}
                                                    </p>

                                                    {(d.masuk || d.pulang) && (
                                                        <p className="text-xs text-muted-foreground tabular-nums">
                                                            Masuk {d.masuk || '–'} · Pulang {d.pulang || '–'}
                                                        </p>
                                                    )}

                                                    {d.catatan && <p className="mt-0.5 text-xs text-muted-foreground">{d.catatan}</p>}
                                                </div>

                                                <span
                                                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${jenisBadge[d.jenis]}`}
                                                >
                                                    {d.status}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                                                        </>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 border-t p-4">
                    <a
                        href={`/admin/peserta/${peserta.id}/export`}
                        className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition hover:bg-muted ${focusRing}`}
                    >
                        <Download className="size-3.5" />
                        Unduh laporan lengkap
                    </a>

                    <button
                        type="button"
                        onClick={onClose}
                        className={`h-9 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 ${focusRing}`}
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}

// ======================================================
// HALAMAN
// ======================================================

export default function PesertaIndex({ pesertas, status, level }: Props) {
    const [q, setQ] = useState('');
    const [page, setPage] = useState(1);
    const [detail, setDetail] = useState<Peserta | null>(null);

    // Kembali ke halaman 1 saat pencarian atau filter berubah
    useEffect(() => {
        setPage(1);
    }, [q, status, level]);

    const filtered = useMemo(() => {
        const key = q.trim().toLowerCase();

        if (!key) return pesertas;

        return pesertas.filter((p) =>
            [p.name, p.email, p.instansi, p.location, p.division]
                .filter(Boolean)
                .some((v) => (v as string).toLowerCase().includes(key)),
        );
    }, [pesertas, q]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const current = Math.min(page, totalPages);
    const start = (current - 1) * PER_PAGE;
    const visible = filtered.slice(start, start + PER_PAGE);

    // Export membawa filter yang sedang aktif (tab, jenjang, dan pencarian)
    const exportUrl = `/admin/peserta/export?${new URLSearchParams({ status, level, q: q.trim() }).toString()}`;

    return (
        <SiamLayout title="Peserta Magang">
            <div className="@container space-y-5">
                {/* TOOLBAR */}
                <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm @3xl:flex-row @3xl:items-center @3xl:justify-between">
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold tracking-tight">Peserta Magang</h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            {pesertas.length} peserta pada filter ini
                            {q.trim() && ` · ${filtered.length} cocok dengan pencarian`}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <a
                            href={exportUrl}
                            title="Unduh rekap kehadiran sesuai filter yang sedang aktif"
                            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-muted ${focusRing}`}
                        >
                            <Download className="size-4" />
                            Export Rekap
                        </a>

                        <Link
                            href="/admin/peserta/create"
                            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 ${focusRing}`}
                        >
                            <Plus className="size-4" />
                            Tambah Peserta
                        </Link>
                    </div>
                </div>

                {/* TABEL */}
                <div className="min-w-0 rounded-2xl border bg-card p-5 shadow-sm">
                    {/* Filter */}
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                        <div className="inline-flex rounded-xl bg-muted p-1">
                            {tabs.map(([key, label]) => (
                                <Link
                                    key={key}
                                    href={`/admin/peserta?status=${key}&level=${level}`}
                                    className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${focusRing} ${
                                        status === key
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {label}
                                </Link>
                            ))}
                        </div>

                        <select
                            value={level}
                            onChange={(e) =>
                                router.get('/admin/peserta', { status, level: e.target.value }, { preserveScroll: true })
                            }
                            className={`h-10 rounded-xl border bg-background px-3 text-sm ${focusRing}`}
                        >
                            {levels.map(([key, label]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>

                        <div className="relative w-full @3xl:ml-auto @3xl:w-80">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />

                            <input
                                type="search"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Cari nama, email, sekolah, lokasi"
                                className={`h-10 w-full rounded-xl border bg-background pr-3 pl-9 text-sm ${focusRing}`}
                            />
                        </div>
                    </div>

                    {visible.length === 0 ? (
                        <p className="py-10 text-center text-sm text-muted-foreground">Tidak ada data.</p>
                    ) : (
                        <>
                            {/* Area sempit (HP): kartu */}
                            <ul className="space-y-3 @3xl:hidden">
                                {visible.map((p, i) => (
                                    <li key={p.id} className="rounded-xl border p-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <Avatar name={p.name} />

                                                <div className="min-w-0">
                                                    <p className="font-medium break-words">
                                                        <span className="mr-1.5 text-muted-foreground tabular-nums">
                                                            {start + i + 1}.
                                                        </span>
                                                        {p.name}
                                                    </p>

                                                    <p className="truncate text-xs text-muted-foreground">{p.email}</p>
                                                </div>
                                            </div>

                                            <StatusBadge value={p.status_magang} />
                                        </div>

                                        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                                            <div>
                                                <dt className="text-xs text-muted-foreground">Jenjang</dt>
                                                <dd>
                                                    {p.education_level
                                                        ? (levelLabel[p.education_level] ?? p.education_level)
                                                        : '–'}
                                                </dd>
                                            </div>

                                            <div>
                                                <dt className="text-xs text-muted-foreground">Penempatan</dt>
                                                <dd>{p.location ?? '–'}</dd>
                                            </div>

                                            <div className="col-span-2">
                                                <dt className="text-xs text-muted-foreground">Asal</dt>
                                                <dd>{p.instansi ?? '–'}</dd>
                                            </div>

                                            <div className="col-span-2">
                                                <dt className="text-xs text-muted-foreground">Periode</dt>
                                                <dd>
                                                    {fmtDate(p.start_date)} – {fmtDate(p.end_date)}
                                                </dd>
                                            </div>

                                            <div className="col-span-2">
                                                <dt className="mb-1 text-xs text-muted-foreground">Kehadiran</dt>
                                                <dd>
                                                    <Kehadiran persen={p.persen} onClick={() => setDetail(p)} />
                                                </dd>
                                            </div>
                                        </dl>

                                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                            <CertSelect p={p} />

                                            <div className="flex items-center gap-2">
                                                <DownloadButton id={p.id} />

                                                <EditButton id={p.id} />
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            {/* Area lebar: tabel */}
                            <div className="hidden overflow-x-auto @3xl:block">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b text-muted-foreground">
                                        <tr>
                                            <th className="w-12 pb-3 font-medium">No</th>
                                            <th className="pb-3 font-medium">Nama</th>
                                            <th className="px-3 pb-3 font-medium">Jenjang</th>
                                            <th className="px-3 pb-3 font-medium">Asal Sekolah/Kampus</th>
                                            <th className="px-3 pb-3 font-medium">Penempatan</th>
                                            <th className="px-3 pb-3 font-medium">Periode</th>
                                            <th className="px-3 pb-3 font-medium">Status</th>
                                            <th className="px-3 pb-3 font-medium">Kehadiran</th>
                                            <th className="px-3 pb-3 font-medium">Sertifikat</th>
                                            <th className="pb-3 text-right font-medium">Aksi</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y">
                                        {visible.map((p, i) => (
                                            <tr key={p.id} className="transition hover:bg-muted/50">
                                                <td className="py-3 pr-2 text-muted-foreground tabular-nums">
                                                    {start + i + 1}
                                                </td>

                                                <td className="py-3 pr-3">
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <Avatar name={p.name} />

                                                        <div className="min-w-0">
                                                            <p className="font-medium">{p.name}</p>

                                                            <p className="text-xs text-muted-foreground">{p.email}</p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    {p.education_level
                                                        ? (levelLabel[p.education_level] ?? p.education_level)
                                                        : '–'}
                                                </td>

                                                <td className="px-3 py-3">{p.instansi ?? '–'}</td>

                                                <td className="px-3 py-3">
                                                    <p>{p.location ?? '–'}</p>

                                                    {p.division && (
                                                        <p className="text-xs text-muted-foreground">{p.division}</p>
                                                    )}
                                                </td>

                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    <p>{fmtDate(p.start_date)}</p>

                                                    <p className="text-xs text-muted-foreground">
                                                        s.d. {fmtDate(p.end_date)}
                                                    </p>
                                                </td>

                                                <td className="px-3 py-3">
                                                    <StatusBadge value={p.status_magang} />
                                                </td>

                                                <td className="px-3 py-3">
                                                    <Kehadiran persen={p.persen} onClick={() => setDetail(p)} />
                                                </td>

                                                <td className="px-3 py-3">
                                                    <CertSelect p={p} />
                                                </td>

                                                <td className="py-3">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <DownloadButton id={p.id} />

                                                        <EditButton id={p.id} />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Paginasi */}
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm">
                                <p className="text-muted-foreground">
                                    Menampilkan {start + 1}–{start + visible.length} dari {filtered.length} peserta
                                </p>

                                {totalPages > 1 && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setPage(current - 1)}
                                            disabled={current === 1}
                                            className={`inline-flex h-9 items-center gap-1 rounded-lg border px-3 font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
                                        >
                                            <ChevronLeft className="size-4" />
                                            Sebelumnya
                                        </button>

                                        <span className="px-2 text-muted-foreground tabular-nums">
                                            {current} / {totalPages}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() => setPage(current + 1)}
                                            disabled={current === totalPages}
                                            className={`inline-flex h-9 items-center gap-1 rounded-lg border px-3 font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
                                        >
                                            Berikutnya
                                            <ChevronRight className="size-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {detail && <DetailModal peserta={detail} onClose={() => setDetail(null)} />}
        </SiamLayout>
    );
}