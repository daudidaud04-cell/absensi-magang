import SiamLayout from '@/components/siam/layout';
import { router, useForm, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, ClipboardCheck, Pencil, Search, Undo2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// ======================================================
// TYPES
// ======================================================

type SerahTerima = {
    diserahkan_oleh: string | null;
    diambil_oleh: string;
    hubungan_pengambil: 'peserta' | 'perwakilan';
    tanggal_diambil: string | null;
    catatan: string | null;
};

type Peserta = {
    id: number;
    name: string;
    email: string;
    instansi: string | null;
    education_level: string | null;
    location: string | null;
    start_date: string | null;
    end_date: string | null;
    serah_terima: SerahTerima | null;
};

type Props = {
    pesertas: Peserta[];
    currentAdminName: string;
};

// ======================================================
// KONSTANTA & HELPERS
// ======================================================

const PER_PAGE = 25;

const tabs = [
    ['semua', 'Semua'],
    ['belum', 'Belum diambil'],
    ['sudah', 'Sudah diambil'],
] as const;

type Tab = (typeof tabs)[number][0];

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

const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-ring/60';

const inputCls = `h-10 w-full rounded-xl border bg-background px-3 text-sm ${focusRing}`;

const fmtDate = (s: string | null) =>
    s ? new Date(`${s}T00:00:00`).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '–';

const hariIni = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD (waktu lokal)

// ======================================================
// KOMPONEN KECIL
// ======================================================

function Avatar({ name }: { name: string }) {
    return (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {name.charAt(0).toUpperCase()}
        </span>
    );
}

function StatusBadge({ sudah }: { sudah: boolean }) {
    return (
        <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ${
                sudah ? 'bg-green-100 text-green-800 ring-green-200' : 'bg-amber-100 text-amber-800 ring-amber-200'
            }`}
        >
            {sudah ? 'Sudah diambil' : 'Belum diambil'}
        </span>
    );
}

function Pengambil({ st }: { st: SerahTerima | null }) {
    if (!st) return <span className="text-muted-foreground">–</span>;

    return (
        <div>
            <p>{st.diambil_oleh}</p>
            <p className="text-xs text-muted-foreground">
                {st.hubungan_pengambil === 'peserta' ? 'Peserta sendiri' : 'Perwakilan'}
            </p>
        </div>
    );
}

function Aksi({ p, onCatat, onBatal }: { p: Peserta; onCatat: () => void; onBatal: () => void }) {
    if (!p.serah_terima) {
        return (
            <button
                type="button"
                onClick={onCatat}
                className={`inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold whitespace-nowrap text-primary-foreground transition hover:bg-primary/90 ${focusRing}`}
            >
                <ClipboardCheck className="size-3.5" />
                Catat Serah Terima
            </button>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={onCatat}
                className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition hover:bg-muted ${focusRing}`}
            >
                <Pencil className="size-3.5" />
                Edit
            </button>

            <button
                type="button"
                onClick={onBatal}
                title="Batalkan catatan serah terima"
                className={`inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-xs font-medium text-red-600 transition hover:bg-red-50 ${focusRing}`}
            >
                <Undo2 className="size-3.5" />
                Batalkan
            </button>
        </div>
    );
}

// ======================================================
// MODAL CATAT SERAH TERIMA
// ======================================================

function SerahTerimaModal({
    peserta,
    currentAdminName,
    onClose,
}: {
    peserta: Peserta;
    currentAdminName: string;
    onClose: () => void;
}) {
    const st = peserta.serah_terima;
    const edit = st !== null;

    const form = useForm({
        diserahkan_nama: st?.diserahkan_oleh ?? currentAdminName,
        hubungan_pengambil: st?.hubungan_pengambil ?? 'peserta',
        diambil_oleh: st?.hubungan_pengambil === 'perwakilan' ? st.diambil_oleh : '',
        tanggal_diambil: st?.tanggal_diambil ?? hariIni(),
        catatan: st?.catatan ?? '',
    });

    // Tutup dengan tombol Esc
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !form.processing && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose, form.processing]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.put(`/admin/sertifikat/${peserta.id}`, {
            preserveScroll: true,
            onSuccess: onClose,
        });
    };

    const perwakilan = form.data.hubungan_pengambil === 'perwakilan';

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
            onClick={() => !form.processing && onClose()}
            role="presentation"
        >
            <form
                onSubmit={submit}
                role="dialog"
                aria-modal="true"
                aria-label="Catat serah terima sertifikat"
                onClick={(e) => e.stopPropagation()}
                className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-2xl border bg-card shadow-xl sm:rounded-2xl"
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 border-b p-5">
                    <div className="min-w-0">
                        <h2 className="text-lg font-bold tracking-tight">
                            {edit ? 'Edit Serah Terima' : 'Catat Serah Terima'}
                        </h2>
                        <p className="truncate text-xs text-muted-foreground">
                            {peserta.name} · {peserta.instansi ?? '–'}
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
                    <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">Diserahkan oleh</label>
                        <input
                            type="text"
                            value={form.data.diserahkan_nama}
                            onChange={(e) => form.setData('diserahkan_nama', e.target.value)}
                            placeholder="Nama petugas yang menyerahkan"
                            className={inputCls}
                        />
                        {form.errors.diserahkan_nama && (
                            <p className="mt-1 text-xs text-red-600">{form.errors.diserahkan_nama}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">Diambil oleh</label>
                        <div className="inline-flex rounded-xl bg-muted p-1">
                            {(
                                [
                                    ['peserta', 'Peserta sendiri'],
                                    ['perwakilan', 'Perwakilan'],
                                ] as const
                            ).map(([key, label]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => {
                                        form.setData('hubungan_pengambil', key);
                                        form.clearErrors('diambil_oleh');
                                    }}
                                    className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${focusRing} ${
                                        form.data.hubungan_pengambil === key
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">Nama pengambil</label>
                        {perwakilan ? (
                            <input
                                type="text"
                                value={form.data.diambil_oleh}
                                onChange={(e) => form.setData('diambil_oleh', e.target.value)}
                                placeholder="Nama orang yang mengambil"
                                className={inputCls}
                            />
                        ) : (
                            <input type="text" value={peserta.name} disabled className={`${inputCls} opacity-70`} />
                        )}
                        {form.errors.diambil_oleh && (
                            <p className="mt-1 text-xs text-red-600">{form.errors.diambil_oleh}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">Tanggal diambil</label>
                        <input
                            type="date"
                            value={form.data.tanggal_diambil}
                            max={hariIni()}
                            onChange={(e) => form.setData('tanggal_diambil', e.target.value)}
                            className={inputCls}
                        />
                        {form.errors.tanggal_diambil && (
                            <p className="mt-1 text-xs text-red-600">{form.errors.tanggal_diambil}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                            Catatan (opsional)
                        </label>
                        <textarea
                            value={form.data.catatan}
                            onChange={(e) => form.setData('catatan', e.target.value)}
                            rows={3}
                            className={`w-full rounded-xl border bg-background px-3 py-2 text-sm ${focusRing}`}
                        />
                        {form.errors.catatan && <p className="mt-1 text-xs text-red-600">{form.errors.catatan}</p>}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 border-t p-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={form.processing}
                        className={`h-9 rounded-lg border px-4 text-xs font-medium transition hover:bg-muted disabled:opacity-50 ${focusRing}`}
                    >
                        Batal
                    </button>

                    <button
                        type="submit"
                        disabled={form.processing}
                        className={`h-9 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50 ${focusRing}`}
                    >
                        {form.processing ? 'Menyimpan…' : 'Simpan'}
                    </button>
                </div>
            </form>
        </div>
    );
}

// ======================================================
// MODAL KONFIRMASI BATALKAN
// ======================================================

function ConfirmBatalModal({
    peserta,
    processing,
    onConfirm,
    onCancel,
}: {
    peserta: Peserta;
    processing: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !processing && onCancel();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onCancel, processing]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => !processing && onCancel()}
            role="presentation"
        >
            <div
                role="alertdialog"
                aria-modal="true"
                aria-label="Konfirmasi batalkan serah terima"
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl"
            >
                <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-red-100">
                    <Undo2 className="size-5 text-red-600" />
                </div>

                <h2 className="text-lg font-bold tracking-tight">Batalkan catatan serah terima?</h2>

                <p className="mt-2 text-sm text-muted-foreground">
                    Catatan serah terima sertifikat{' '}
                    <span className="font-semibold text-foreground">{peserta.name}</span> akan dihapus dan statusnya
                    kembali menjadi <span className="font-semibold text-foreground">Belum diambil</span>.
                </p>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={processing}
                        className={`h-9 rounded-lg border px-4 text-xs font-medium transition hover:bg-muted disabled:opacity-50 ${focusRing}`}
                    >
                        Kembali
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={processing}
                        className={`h-9 rounded-lg bg-red-600 px-4 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50 ${focusRing}`}
                    >
                        {processing ? 'Memproses…' : 'Ya, batalkan'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ======================================================
// HALAMAN
// ======================================================

export default function SertifikatIndex({ pesertas, currentAdminName }: Props) {
    const { flash } = usePage<{ flash?: { success?: string } }>().props;

    const [tab, setTab] = useState<Tab>('semua');
    const [level, setLevel] = useState('semua');
    const [lokasi, setLokasi] = useState('semua');
    const [q, setQ] = useState('');
    const [page, setPage] = useState(1);
    const [catat, setCatat] = useState<Peserta | null>(null);
    const [batal, setBatal] = useState<Peserta | null>(null);
    const [processing, setProcessing] = useState(false);

    const daftarLokasi = useMemo(
        () => Array.from(new Set(pesertas.map((p) => p.location).filter(Boolean) as string[])).sort(),
        [pesertas],
    );

    const jumlah = useMemo(() => {
        const sudah = pesertas.filter((p) => p.serah_terima).length;
        return { semua: pesertas.length, sudah, belum: pesertas.length - sudah };
    }, [pesertas]);

    useEffect(() => {
        setPage(1);
    }, [tab, level, lokasi, q]);

    const filtered = useMemo(() => {
        const key = q.trim().toLowerCase();

        return pesertas.filter((p) => {
            if (tab === 'belum' && p.serah_terima) return false;
            if (tab === 'sudah' && !p.serah_terima) return false;
            if (level !== 'semua' && p.education_level !== level) return false;
            if (lokasi !== 'semua' && p.location !== lokasi) return false;
            if (!key) return true;

            return [p.name, p.email, p.instansi, p.location, p.serah_terima?.diambil_oleh, p.serah_terima?.diserahkan_oleh]
                .filter(Boolean)
                .some((v) => (v as string).toLowerCase().includes(key));
        });
    }, [pesertas, tab, level, lokasi, q]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const current = Math.min(page, totalPages);
    const start = (current - 1) * PER_PAGE;
    const visible = filtered.slice(start, start + PER_PAGE);

    const konfirmasiBatal = () => {
        if (!batal) return;

        router.delete(`/admin/sertifikat/${batal.id}`, {
            preserveScroll: true,
            onStart: () => setProcessing(true),
            onFinish: () => {
                setProcessing(false);
                setBatal(null);
            },
        });
    };

    return (
        <SiamLayout title="Sertifikat">
            <div className="@container space-y-5">
                {/* PESAN SUKSES */}
                {flash?.success && (
                    <div
                        role="status"
                        className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
                    >
                        {flash.success}
                    </div>
                )}

                {/* HEADER */}
                <div className="rounded-2xl border bg-card p-5 shadow-sm">
                    <h1 className="text-2xl font-bold tracking-tight">Sertifikat</h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Pencatatan serah terima sertifikat peserta yang magangnya sudah selesai · {jumlah.sudah} sudah
                        diambil, {jumlah.belum} belum diambil
                    </p>
                </div>

                {/* TABEL */}
                <div className="min-w-0 rounded-2xl border bg-card p-5 shadow-sm">
                    {/* Filter */}
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
                                    {label}{' '}
                                    <span className="text-xs text-muted-foreground tabular-nums">
                                        {key === 'semua' ? jumlah.semua : key === 'belum' ? jumlah.belum : jumlah.sudah}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <select
                            value={level}
                            onChange={(e) => setLevel(e.target.value)}
                            className={`h-10 rounded-xl border bg-background px-3 text-sm ${focusRing}`}
                        >
                            {levels.map(([key, label]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>

                        <select
                            value={lokasi}
                            onChange={(e) => setLokasi(e.target.value)}
                            className={`h-10 rounded-xl border bg-background px-3 text-sm ${focusRing}`}
                        >
                            <option value="semua">Semua lokasi</option>
                            {daftarLokasi.map((l) => (
                                <option key={l} value={l}>
                                    {l}
                                </option>
                            ))}
                        </select>

                        <div className="relative w-full @3xl:ml-auto @3xl:w-80">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />

                            <input
                                type="search"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Cari nama, email, sekolah, pengambil"
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

                                            <StatusBadge sudah={p.serah_terima !== null} />
                                        </div>

                                        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                                            <div className="col-span-2">
                                                <dt className="text-xs text-muted-foreground">Sekolah/Kampus</dt>
                                                <dd>
                                                    {p.instansi ?? '–'}
                                                    <span className="text-xs text-muted-foreground">
                                                        {' · '}
                                                        {p.education_level
                                                            ? (levelLabel[p.education_level] ?? p.education_level)
                                                            : '–'}
                                                    </span>
                                                </dd>
                                            </div>

                                            <div className="col-span-2">
                                                <dt className="text-xs text-muted-foreground">Penempatan & Periode</dt>
                                                <dd>
                                                    {p.location ?? '–'}
                                                    <span className="block text-xs text-muted-foreground">
                                                        {fmtDate(p.start_date)} s.d. {fmtDate(p.end_date)}
                                                    </span>
                                                </dd>
                                            </div>

                                            {p.serah_terima && (
                                                <>
                                                    <div>
                                                        <dt className="text-xs text-muted-foreground">Diserahkan oleh</dt>
                                                        <dd>{p.serah_terima.diserahkan_oleh ?? '–'}</dd>
                                                    </div>

                                                    <div>
                                                        <dt className="text-xs text-muted-foreground">Tanggal diambil</dt>
                                                        <dd>{fmtDate(p.serah_terima.tanggal_diambil)}</dd>
                                                    </div>

                                                    <div className="col-span-2">
                                                        <dt className="text-xs text-muted-foreground">Diambil oleh</dt>
                                                        <dd>
                                                            <Pengambil st={p.serah_terima} />
                                                        </dd>
                                                    </div>
                                                </>
                                            )}
                                        </dl>

                                        <div className="mt-3 flex justify-end">
                                            <Aksi p={p} onCatat={() => setCatat(p)} onBatal={() => setBatal(p)} />
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
                                            <th className="pb-3 font-medium">Peserta</th>
                                            <th className="px-3 pb-3 font-medium">Sekolah/Kampus</th>
                                            <th className="px-3 pb-3 font-medium">Penempatan & Periode</th>
                                            <th className="px-3 pb-3 font-medium">Status</th>
                                            <th className="px-3 pb-3 font-medium">Diserahkan oleh</th>
                                            <th className="px-3 pb-3 font-medium">Diambil oleh</th>
                                            <th className="px-3 pb-3 font-medium">Tanggal Diambil</th>
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
                                                            <p className="font-medium break-words">{p.name}</p>
                                                            <p className="text-xs text-muted-foreground">{p.email}</p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-3 py-3">
                                                    <p>{p.instansi ?? '–'}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {p.education_level
                                                            ? (levelLabel[p.education_level] ?? p.education_level)
                                                            : '–'}
                                                    </p>
                                                </td>

                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    <p>{p.location ?? '–'}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {fmtDate(p.start_date)} s.d. {fmtDate(p.end_date)}
                                                    </p>
                                                </td>

                                                <td className="px-3 py-3">
                                                    <StatusBadge sudah={p.serah_terima !== null} />
                                                </td>

                                                <td className="px-3 py-3">{p.serah_terima?.diserahkan_oleh ?? '–'}</td>

                                                <td className="px-3 py-3">
                                                    <Pengambil st={p.serah_terima} />
                                                </td>

                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    {fmtDate(p.serah_terima?.tanggal_diambil ?? null)}
                                                </td>

                                                <td className="py-3">
                                                    <div className="flex justify-end">
                                                        <Aksi
                                                            p={p}
                                                            onCatat={() => setCatat(p)}
                                                            onBatal={() => setBatal(p)}
                                                        />
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

            {catat && (
                <SerahTerimaModal
                    peserta={catat}
                    currentAdminName={currentAdminName}
                    onClose={() => setCatat(null)}
                />
            )}

            {batal && (
                <ConfirmBatalModal
                    peserta={batal}
                    processing={processing}
                    onConfirm={konfirmasiBatal}
                    onCancel={() => setBatal(null)}
                />
            )}
        </SiamLayout>
    );
}