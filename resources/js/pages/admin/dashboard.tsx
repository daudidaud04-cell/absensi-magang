import SiamLayout from '@/components/siam/layout';
import { Link, router, usePage } from '@inertiajs/react';
import {
    ArrowUpRight,
    Check,
    CircleCheck,
    Clock,
    Copy,
    Download,
    FileText,
    OctagonAlert,
    Plus,
    RefreshCw,
    TriangleAlert,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';

// ======================================================
// TYPES
// ======================================================

type Row = {
    id: number;
    name: string;
    time_in: string | null;
    time_out: string | null;
    status: string;
    source: string;
    is_flagged: boolean;
    has_in: boolean;
    has_out: boolean;
    distance_in: number | null;
};

type Props = {
    date: string;
    stats: { aktif: number; hadir: number; terlambat: number; izin: number; alpha: number; persen: number };
    rows: Row[];
    belum: string[];
};

// ======================================================
// HELPERS
// ======================================================

const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);

const hhmm = (t: string | null) => (t ? t.slice(0, 5) : null);

const greetingFor = (date: Date) => {
    const h = date.getHours();

    if (h < 11) return 'Selamat pagi';
    if (h < 15) return 'Selamat siang';
    if (h < 18) return 'Selamat sore';

    return 'Selamat malam';
};

const clockTime = (date: Date) => date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

const statusLabel: Record<string, string> = {
    hadir: 'Hadir',
    terlambat: 'Terlambat',
    izin: 'Izin',
    sakit: 'Sakit',
    alpha: 'Alpha',
};

const statusBadge: Record<string, string> = {
    hadir: 'bg-green-100 text-green-800 ring-1 ring-green-200',
    terlambat: 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200',
    izin: 'bg-sky-100 text-sky-800 ring-1 ring-sky-200',
    sakit: 'bg-sky-100 text-sky-800 ring-1 ring-sky-200',
    alpha: 'bg-red-100 text-red-800 ring-1 ring-red-200',
};

// ======================================================
// STYLING
// ======================================================

const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-ring/60';

type Tone = { bar: string; iconBox: string; value: string };

const tones: Record<'hadir' | 'terlambat' | 'izin' | 'alpha', Tone> = {
    hadir: {
        bar: 'from-green-400 to-emerald-600',
        iconBox: 'bg-green-500/10 text-green-600 ring-1 ring-green-500/20',
        value: 'text-green-600',
    },
    terlambat: {
        bar: 'from-yellow-400 to-amber-500',
        iconBox: 'bg-yellow-500/10 text-yellow-700 ring-1 ring-yellow-500/20',
        value: 'text-yellow-700',
    },
    izin: {
        bar: 'from-sky-400 to-blue-600',
        iconBox: 'bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/20',
        value: 'text-sky-600',
    },
    alpha: {
        bar: 'from-red-400 to-red-600',
        iconBox: 'bg-red-500/10 text-red-600 ring-1 ring-red-500/20',
        value: 'text-red-600',
    },
};

// ======================================================
// JAM BERJALAN (dipasang di client saja agar tidak error hydration)
// ======================================================

function LiveClock() {
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        setNow(new Date());

        const t = window.setInterval(() => setNow(new Date()), 1000);

        return () => window.clearInterval(t);
    }, []);

    if (!now) return <span className="inline-block h-5 w-40" />;

    const tanggal = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });

    const waktu = now.toLocaleTimeString('id-ID', { hour12: false }).replace(/\./g, ':');

    return (
        <span suppressHydrationWarning className="inline-flex flex-wrap items-center gap-x-3">
            <span>{tanggal}</span>
            <span className="font-mono text-foreground">{waktu} WIB</span>
        </span>
    );
}

// ======================================================
// STAT CARD
// ======================================================

function StatCard({
    title,
    value,
    total,
    note,
    tone,
    icon: Icon,
    href,
}: {
    title: string;
    value: number;
    total: number;
    note: string;
    tone: Tone;
    icon: ComponentType<{ className?: string }>;
    href: string;
}) {
    return (
        <a
            href={href}
            className={`group relative min-w-0 overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${focusRing}`}
        >
            <div className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${tone.bar}`} />

            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>

                    <p className={`mt-2 text-3xl font-bold tracking-tight sm:text-4xl ${tone.value}`}>
                        {fmt(value)}
                        <span className="ml-1.5 text-sm font-medium text-muted-foreground">orang</span>
                    </p>
                </div>

                <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${tone.iconBox}`}>
                    <Icon className="size-5" />
                </div>
            </div>

            <div className="mt-4 flex items-end justify-between gap-2 text-sm text-slate-600">
                <span className="min-w-0">
                    dari {fmt(total)} peserta · {note}
                </span>

                <ArrowUpRight className="size-4 shrink-0 opacity-40 transition group-hover:opacity-100" />
            </div>
        </a>
    );
}

// ======================================================
// PANEL
// ======================================================

function Panel({ children, className = '', id }: { children: ReactNode; className?: string; id?: string }) {
    return (
        <div id={id} className={`min-w-0 scroll-mt-4 rounded-2xl border bg-card p-5 shadow-sm ${className}`}>
            {children}
        </div>
    );
}

function PanelTitle({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
    return (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
            <div className="min-w-0 flex-1 basis-56">
                <h2 className="font-semibold tracking-tight">{title}</h2>

                <p className="text-sm text-slate-600">{subtitle}</p>
            </div>

            {action}
        </div>
    );
}

// ======================================================
// ATTENTION ITEM
// ======================================================

function AttentionItem({
    href,
    icon: Icon,
    count,
    label,
    hint,
    box,
}: {
    href: string;
    icon: ComponentType<{ className?: string }>;
    count: number;
    label: string;
    hint: string;
    box: string;
}) {
    return (
        <a
            href={href}
            title={hint}
            className={`group flex min-w-0 items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm transition-shadow duration-200 hover:shadow-md ${focusRing}`}
        >
            <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${box}`}>
                <Icon className="size-5" />
            </div>

            <div className="min-w-0 flex-1">
                <p className="text-2xl leading-none font-bold tracking-tight">{fmt(count)}</p>

                <p className="mt-1 text-sm font-medium">{label}</p>

                <p className="line-clamp-2 text-sm text-slate-600">{hint}</p>
            </div>

            <ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-40 transition group-hover:opacity-100" />
        </a>
    );
}

// ======================================================
// DONUT CHART
// ======================================================

function Donut({
    segments,
    total,
    children,
}: {
    segments: { n: number; color: string }[];
    total: number;
    children: ReactNode;
}) {
    const r = 40;
    const c = 2 * Math.PI * r;

    let offset = 0;

    return (
        <div className="relative mx-auto size-40">
            <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                <circle cx="50" cy="50" r={r} fill="none" strokeWidth="12" stroke="currentColor" className="text-muted" />

                {total > 0 &&
                    segments.map((s, i) => {
                        const len = (s.n / total) * c;

                        const el = (
                            <circle
                                key={i}
                                cx="50"
                                cy="50"
                                r={r}
                                fill="none"
                                strokeWidth="12"
                                stroke={s.color}
                                strokeDasharray={`${len} ${c - len}`}
                                strokeDashoffset={-offset}
                            />
                        );

                        offset += len;

                        return el;
                    })}
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
        </div>
    );
}

// ======================================================
// BAGIAN BARIS ABSENSI (dipakai di tabel dan kartu HP)
// ======================================================

function StatusBadge({ status }: { status: string }) {
    return (
        <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${statusBadge[status] ?? 'bg-muted text-foreground ring-1 ring-border'}`}
        >
            {statusLabel[status] ?? status}
        </span>
    );
}

function PhotoLinks({ r }: { r: Row }) {
    const cls = `rounded-lg border px-2.5 py-1 text-xs font-medium transition hover:bg-muted ${focusRing}`;

    if (!r.has_in && !r.has_out) return <span className="text-muted-foreground">–</span>;

    return (
        <div className="flex gap-1.5">
            {r.has_in && (
                <a href={`/foto/${r.id}/in`} target="_blank" rel="noreferrer" className={cls}>
                    Masuk
                </a>
            )}

            {r.has_out && (
                <a href={`/foto/${r.id}/out`} target="_blank" rel="noreferrer" className={cls}>
                    Pulang
                </a>
            )}
        </div>
    );
}

function FlagButton({ r }: { r: Row }) {
    return (
        <button
            type="button"
            onClick={() => router.patch(`/admin/absensi/${r.id}/flag`, {}, { preserveScroll: true })}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition ${focusRing} ${
                r.is_flagged
                    ? 'border-border text-muted-foreground hover:bg-muted'
                    : 'border-red-200 text-red-600 hover:bg-red-50'
            }`}
        >
            {r.is_flagged ? 'Hapus tanda' : 'Tandai curiga'}
        </button>
    );
}

function NameCell({ r }: { r: Row }) {
    return (
        <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {r.name.charAt(0).toUpperCase()}
            </span>

            <div className="min-w-0">
                <p className="font-medium break-words">{r.name}</p>

                {(r.source === 'manual' || r.is_flagged) && (
                    <p className="text-xs text-muted-foreground">
                        {r.source === 'manual' && 'Input manual'}
                        {r.source === 'manual' && r.is_flagged && ' · '}
                        {r.is_flagged && <span className="font-medium text-red-600">Ditandai curiga</span>}
                    </p>
                )}
            </div>
        </div>
    );
}

// ======================================================
// DASHBOARD
// ======================================================

export default function AdminDashboard({ date, stats, rows, belum }: Props) {
    const { auth } = usePage<{ auth?: { user?: { name?: string } } }>().props;

    // --------------------------------------------------
    // STATE
    // --------------------------------------------------

    const [now, setNow] = useState<Date | null>(null);
    const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [refreshStatus, setRefreshStatus] = useState<'idle' | 'refreshing' | 'success' | 'error'>('idle');
    const [q, setQ] = useState('');
    const [copied, setCopied] = useState(false);

    const refreshingRef = useRef(false);

    useEffect(() => {
        const t = new Date();

        setNow(t);
        setUpdatedAt(t);
    }, []);

    // --------------------------------------------------
    // REFRESH
    // --------------------------------------------------

    const refresh = useCallback(() => {
        if (refreshingRef.current) return;

        refreshingRef.current = true;

        setRefreshing(true);
        setRefreshStatus('refreshing');

        router.reload({
            only: ['stats', 'rows', 'belum'],

            onSuccess: () => {
                setUpdatedAt(new Date());
                setRefreshStatus('success');
            },

            onError: () => setRefreshStatus('error'),

            onFinish: () => {
                refreshingRef.current = false;
                setRefreshing(false);
            },
        });
    }, []);

    useEffect(() => {
        const interval = window.setInterval(refresh, 60_000);

        return () => window.clearInterval(interval);
    }, [refresh]);

    useEffect(() => {
        if (refreshStatus !== 'success' && refreshStatus !== 'error') return;

        const timeout = window.setTimeout(() => setRefreshStatus('idle'), 5000);

        return () => window.clearTimeout(timeout);
    }, [refreshStatus]);

    // --------------------------------------------------
    // SALIN DAFTAR BELUM ABSEN
    // --------------------------------------------------

    const copyBelum = async () => {
        try {
            await navigator.clipboard.writeText(belumSorted.join('\n'));

            setCopied(true);

            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    };

    // --------------------------------------------------
    // TURUNAN DATA
    // --------------------------------------------------

    const firstName = (auth?.user?.name ?? '').split(' ')[0];

    const greeting = now
        ? `${greetingFor(now)}${firstName ? `, ${firstName}` : ''}`
        : `Selamat datang${firstName ? `, ${firstName}` : ''}`;

    const curiga = rows.filter((r) => r.is_flagged).length;

    const segments = [
        { label: 'Hadir', n: stats.hadir, dot: 'bg-green-500', hex: '#22c55e' },
        { label: 'Terlambat', n: stats.terlambat, dot: 'bg-yellow-500', hex: '#eab308' },
        { label: 'Izin/Sakit', n: stats.izin, dot: 'bg-sky-500', hex: '#0ea5e9' },
        { label: 'Alpha', n: stats.alpha, dot: 'bg-red-500', hex: '#ef4444' },
        { label: 'Belum absen', n: belum.length, dot: 'bg-slate-300', hex: '#cbd5e1' },
    ];

    const donutTotal = segments.reduce((sum, s) => sum + s.n, 0);

    const pct = (n: number) => (donutTotal > 0 ? Math.round((n / donutTotal) * 100) : 0);

    const belumSorted = useMemo(() => [...belum].sort((a, b) => a.localeCompare(b, 'id', { sensitivity: 'base' })), [belum]);

    const belumFiltered = useMemo(
        () => belumSorted.filter((n) => n.toLowerCase().includes(q.toLowerCase())),
        [belumSorted, q],
    );
    // --------------------------------------------------
    // PERLU PERHATIAN
    // --------------------------------------------------

    const attentionItems: ReactNode[] = [];

    if (curiga > 0) {
        attentionItems.push(
            <AttentionItem
                key="curiga"
                href="#absensi"
                icon={OctagonAlert}
                count={curiga}
                label="Absensi ditandai curiga"
                hint="Periksa foto dan jarak lokasinya"
                box="bg-red-500/10 text-red-600 ring-1 ring-red-500/20"
            />,
        );
    }

    if (stats.alpha > 0) {
        attentionItems.push(
            <AttentionItem
                key="alpha"
                href="#absensi"
                icon={TriangleAlert}
                count={stats.alpha}
                label="Peserta alpha"
                hint="Tanpa keterangan hari ini"
                box="bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20"
            />,
        );
    }

    if (belum.length > 0) {
        attentionItems.push(
            <AttentionItem
                key="belum"
                href="#belum-absen"
                icon={Clock}
                count={belum.length}
                label="Peserta belum absen"
                hint="Lihat daftar namanya di bawah"
                box="bg-slate-500/10 text-slate-600 ring-1 ring-slate-500/20"
            />,
        );
    }

    const attentionGrid =
        attentionItems.length === 1
            ? 'grid-cols-1'
            : attentionItems.length === 2
              ? 'grid-cols-1 @2xl:grid-cols-2'
              : 'grid-cols-1 @2xl:grid-cols-2 @5xl:grid-cols-3';

    // ==================================================
    // RENDER
    // ==================================================

    return (
        <SiamLayout title="Dashboard Admin">
            <div className="@container space-y-5">
                {/* HEADER */}
                <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm @3xl:flex-row @3xl:items-center @3xl:justify-between">
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-muted-foreground">Sistem Informasi Absensi Magang</p>

                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">{greeting}</h1>

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                            <LiveClock />

                            <span suppressHydrationWarning>
                                {updatedAt ? `Terakhir diperbarui ${clockTime(updatedAt)}` : 'Menunggu data...'}
                            </span>

                            <span role="status" aria-live="polite" className="inline-flex items-center gap-1">
                                {refreshStatus === 'refreshing' && (
                                    <>
                                        <RefreshCw className="size-3 animate-spin" />
                                        Sedang memperbarui...
                                    </>
                                )}

                                {refreshStatus === 'success' && <span className="text-green-600">✓ Berhasil diperbarui</span>}

                                {refreshStatus === 'error' && <span className="text-red-600">Gagal memperbarui.</span>}
                            </span>

                            <button
                                type="button"
                                onClick={refresh}
                                disabled={refreshing}
                                title="Perbarui data dashboard sekarang"
                                className={`inline-flex h-11 items-center gap-1.5 rounded-lg border px-4 font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
                            >
                                <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                                {refreshing ? 'Memperbarui...' : 'Perbarui'}
                            </button>
                        </div>

                        <p className="mt-2 text-xs text-muted-foreground">Dashboard diperbarui otomatis setiap 60 detik.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <Link
                            href="/admin/manual"
                            className={`inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 ${focusRing}`}
                        >
                            <Plus className="size-4" />
                            Absen Manual
                        </Link>

                        <a
                            href="#ekspor"
                            className={`inline-flex h-11 items-center gap-2 rounded-xl border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-muted ${focusRing}`}
                        >
                            <Download className="size-4" />
                            Export Excel
                        </a>
                    </div>
                </div>

                {/* STATISTIK */}
                <div className="grid grid-cols-1 gap-4 @lg:grid-cols-2 @4xl:grid-cols-4">
                    <StatCard
                        title="Hadir"
                        value={stats.hadir}
                        total={stats.aktif}
                        note="tepat waktu"
                        tone={tones.hadir}
                        icon={CircleCheck}
                        href="#absensi"
                    />

                    <StatCard
                        title="Terlambat"
                        value={stats.terlambat}
                        total={stats.aktif}
                        note="lewat jam mulai"
                        tone={tones.terlambat}
                        icon={Clock}
                        href="#absensi"
                    />

                    <StatCard
                        title="Izin/Sakit"
                        value={stats.izin}
                        total={stats.aktif}
                        note="dengan keterangan"
                        tone={tones.izin}
                        icon={FileText}
                        href="#absensi"
                    />

                    <StatCard
                        title="Alpha"
                        value={stats.alpha}
                        total={stats.aktif}
                        note="tanpa keterangan"
                        tone={tones.alpha}
                        icon={OctagonAlert}
                        href="#absensi"
                    />
                </div>

                {/* PERLU PERHATIAN */}
                {attentionItems.length > 0 && (
                    <div>
                        <h2 className="mb-3 font-semibold tracking-tight">Perlu perhatian</h2>

                        <div className={`grid gap-4 ${attentionGrid}`}>{attentionItems}</div>
                    </div>
                )}

                {/* ABSENSI HARI INI (selebar halaman, tinggi dibatasi) */}
                <Panel id="absensi">
                    <PanelTitle
                        title="Absensi Hari Ini"
                        subtitle={`${fmt(rows.length)} dari ${fmt(stats.aktif)} peserta sudah tercatat · ${date}`}
                    />

                    {rows.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">Belum ada absensi hari ini.</p>
                    ) : (
                        <div className="max-h-[32rem] overflow-auto">
                            {/* Area sempit (HP): kartu */}
                            <ul className="space-y-3 @3xl:hidden">
                                {rows.map((r) => (
                                    <li
                                        key={r.id}
                                        className={`rounded-xl border p-3 ${r.is_flagged ? 'border-red-200 bg-red-50/60' : ''}`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <NameCell r={r} />

                                            <StatusBadge status={r.status} />
                                        </div>

                                        <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                                            <div>
                                                <dt className="text-xs text-muted-foreground">Masuk</dt>
                                                <dd className="font-medium tabular-nums">{hhmm(r.time_in) ?? '–'}</dd>
                                            </div>

                                            <div>
                                                <dt className="text-xs text-muted-foreground">Pulang</dt>
                                                <dd className="font-medium tabular-nums">
                                                    {hhmm(r.time_out) ??
                                                        (r.time_in ? (
                                                            <span className="text-xs font-normal text-muted-foreground">
                                                                belum
                                                            </span>
                                                        ) : (
                                                            '–'
                                                        ))}
                                                </dd>
                                            </div>

                                            <div>
                                                <dt className="text-xs text-muted-foreground">Jarak</dt>
                                                <dd className="font-medium">
                                                    {r.distance_in !== null ? `${Math.round(r.distance_in)} m` : '–'}
                                                </dd>
                                            </div>
                                        </dl>

                                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                            <PhotoLinks r={r} />

                                            <FlagButton r={r} />
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            {/* Area lebar: tabel */}
                            <table className="hidden w-full text-left text-sm @3xl:table">
                                <thead className="sticky top-0 z-10 border-b bg-card text-muted-foreground">
                                    <tr>
                                        <th className="pb-3 font-medium">Nama</th>
                                        <th className="px-3 pb-3 font-medium">Status</th>
                                        <th className="px-3 pb-3 font-medium">Masuk</th>
                                        <th className="px-3 pb-3 font-medium">Pulang</th>
                                        <th className="px-3 pb-3 font-medium">Jarak</th>
                                        <th className="px-3 pb-3 font-medium">Foto</th>
                                        <th className="pb-3 text-right font-medium">Aksi</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y">
                                    {rows.map((r) => (
                                        <tr
                                            key={r.id}
                                            className={r.is_flagged ? 'bg-red-50/60' : 'transition hover:bg-muted/50'}
                                        >
                                            <td className="py-3 pr-3">
                                                <NameCell r={r} />
                                            </td>

                                            <td className="px-3 py-3">
                                                <StatusBadge status={r.status} />
                                            </td>

                                            <td className="px-3 py-3 font-medium tabular-nums">{hhmm(r.time_in) ?? '–'}</td>

                                            <td className="px-3 py-3 tabular-nums">
                                                {hhmm(r.time_out) ??
                                                    (r.time_in ? (
                                                        <span className="text-xs text-muted-foreground">Belum pulang</span>
                                                    ) : (
                                                        '–'
                                                    ))}
                                            </td>

                                            <td className="px-3 py-3 whitespace-nowrap text-slate-600">
                                                {r.distance_in !== null ? `${Math.round(r.distance_in)} m` : '–'}
                                            </td>

                                            <td className="px-3 py-3">
                                                <PhotoLinks r={r} />
                                            </td>

                                            <td className="py-3 text-right">
                                                <FlagButton r={r} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Panel>

                {/* KEHADIRAN + BELUM ABSEN (satu baris, tinggi seimbang) */}
                <div className="grid grid-cols-1 items-stretch gap-6 @4xl:grid-cols-3">
                    {/* KEHADIRAN */}
                    <Panel>
                        <PanelTitle title="Kehadiran" subtitle="Hadir + terlambat dari peserta aktif" />

                        <Donut segments={segments.map((s) => ({ n: s.n, color: s.hex }))} total={donutTotal}>
                            <span className="text-3xl font-bold tracking-tight">{stats.persen}%</span>

                            <span className="text-sm text-slate-600">hadir</span>
                        </Donut>

                        <div className="mt-5 space-y-3">
                            {segments.map((s) => (
                                <div key={s.label} className="flex items-center justify-between gap-3 text-sm">
                                    <span className="flex items-center gap-2">
                                        <span className={`size-2.5 rounded-full ${s.dot}`} />

                                        {s.label}
                                    </span>

                                    <span className="font-medium">
                                        {fmt(s.n)} <span className="font-normal text-slate-600">({pct(s.n)}%)</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Panel>

                    {/* BELUM ABSEN */}
                    <Panel id="belum-absen" className="flex flex-col @4xl:col-span-2">
                        <PanelTitle
                            title="Belum Absen"
                            subtitle={
                                q.trim()
                                    ? `Menampilkan ${fmt(belumFiltered.length)} dari ${fmt(belum.length)} yang belum absen`
                                    : `${fmt(belum.length)} dari ${fmt(stats.aktif)} peserta belum absen`
                            }
                                action={
                                belum.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={copyBelum}
                                        className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border px-3.5 text-sm font-medium transition hover:bg-muted ${focusRing}`}
                                    >
                                        {copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
                                        {copied ? 'Tersalin' : 'Salin daftar'}
                                    </button>
                                )
                            }
                        />

                        {belum.length === 0 ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">Semua peserta sudah absen.</p>
                        ) : (
                            <>
                                <input
                                    type="search"
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    placeholder="Cari nama peserta"
                                    className={`mb-3 h-10 w-full rounded-xl border bg-background px-3.5 text-sm ${focusRing}`}
                                />

                                {belumFiltered.length === 0 ? (
                                    <p className="py-6 text-center text-sm text-muted-foreground">
                                        Tidak ada nama yang cocok.
                                    </p>
                                ) : (
                                    <ul className="grid max-h-80 grid-cols-1 content-start gap-2 overflow-y-auto pr-1 @xl:grid-cols-2 @4xl:grid-cols-3">
                                        {belumFiltered.map((nama, i) => (
                                            <li
                                                key={`${nama}-${i}`}
                                                className="flex min-w-0 items-center gap-2.5 rounded-lg bg-muted/60 px-3 py-2 text-sm"
                                            >
                                                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-background text-xs font-semibold text-muted-foreground ring-1 ring-border">
                                                    {nama.charAt(0).toUpperCase()}
                                                </span>

                                                <span className="truncate" title={nama}>
                                                    {nama}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </>
                        )}
                    </Panel>
                </div>

                {/* EKSPOR */}
                <Panel id="ekspor">
                    <PanelTitle title="Ekspor Laporan" subtitle="File CSV, bisa langsung dibuka di Excel" />

                    <form action="/admin/laporan/export" method="get" className="flex flex-wrap items-end gap-3">
                        <label className="text-sm text-slate-600">
                            Dari
                            <input
                                type="date"
                                name="from"
                                required
                                defaultValue={`${date.slice(0, 8)}01`}
                                className={`mt-1 block h-11 rounded-xl border bg-background px-3 text-sm text-foreground ${focusRing}`}
                            />
                        </label>

                        <label className="text-sm text-slate-600">
                            Sampai
                            <input
                                type="date"
                                name="to"
                                required
                                defaultValue={date}
                                className={`mt-1 block h-11 rounded-xl border bg-background px-3 text-sm text-foreground ${focusRing}`}
                            />
                        </label>

                        <button
                            className={`inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 ${focusRing}`}
                        >
                            <Download className="size-4" />
                            Unduh
                        </button>
                    </form>
                </Panel>
            </div>
        </SiamLayout>
    );
}