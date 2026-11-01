import { Search } from 'lucide-react';
import type { ReactNode } from 'react';

export const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-ring/60';

// Tombol utama (sama seperti "Tambah Peserta")
export const primaryBtn = `inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

// Tombol sekunder (sama seperti "Export Rekap")
export const secondaryBtn = `inline-flex h-11 items-center justify-center gap-2 rounded-xl border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-muted ${focusRing}`;

// Tombol kecil di baris tabel (sama seperti "Edit")
export const rowBtn = `inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition hover:bg-muted ${focusRing}`;

// Varian untuk aksi berbahaya (Hapus)
export const dangerRowBtn = `inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-xs font-medium text-red-700 transition hover:bg-red-50 ${focusRing}`;

// Input teks
export const fieldCls = `h-10 w-full rounded-xl border bg-background px-3 text-sm ${focusRing}`;

const badgeStyle: Record<string, string> = {
    aktif: 'bg-green-100 text-green-800 ring-1 ring-green-200',
    nonaktif: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
    alumni: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
    selesai: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
};

export function StatusBadge({ value }: { value: string }) {
    return (
        <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap capitalize ${
                badgeStyle[value] ?? 'bg-muted text-foreground ring-1 ring-border'
            }`}
        >
            {value}
        </span>
    );
}

// Kartu header halaman: judul, subjudul, tombol aksi di kanan
export function PageHeader({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: ReactNode;
    children?: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm @3xl:flex-row @3xl:items-center @3xl:justify-between">
            <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            </div>

            {children && <div className="flex flex-wrap items-center gap-2.5">{children}</div>}
        </div>
    );
}

// Kartu isi (form atau tabel)
export function Panel({ title, children }: { title?: string; children: ReactNode }) {
    return (
        <div className="min-w-0 rounded-2xl border bg-card p-5 shadow-sm">
            {title && <h2 className="mb-4 text-lg font-semibold tracking-tight">{title}</h2>}
            {children}
        </div>
    );
}

export function SearchBox({
    value,
    onChange,
    placeholder,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
}) {
    return (
        <div className="relative w-full @3xl:ml-auto @3xl:w-80">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />

            <input
                type="search"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`h-10 w-full rounded-xl border bg-background pr-3 pl-9 text-sm ${focusRing}`}
            />
        </div>
    );
}