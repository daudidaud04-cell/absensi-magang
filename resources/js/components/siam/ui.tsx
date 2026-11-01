import type { ReactNode } from 'react';

export const inputCls =
    'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none';
export const btnCls =
    'rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50';
export const btnGhostCls = 'rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100';

export function Card({ title, children }: { title?: string; children: ReactNode }) {
    return (
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            {title && <h2 className="mb-3 font-semibold">{title}</h2>}
            {children}
        </section>
    );
}

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
    return (
        <label className="block text-sm">
            <span className="mb-1 block font-medium">{label}</span>
            {children}
            {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
        </label>
    );
}

export function Errors({ errors }: { errors: Record<string, string> }) {
    const list = Object.values(errors);
    if (!list.length) return null;
    return (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {list.map((e, i) => (
                <p key={i}>{e}</p>
            ))}
        </div>
    );
}

const colors: Record<string, string> = {
    hadir: 'bg-green-100 text-green-800',
    terlambat: 'bg-yellow-100 text-yellow-800',
    izin: 'bg-blue-100 text-blue-800',
    sakit: 'bg-blue-100 text-blue-800',
    alpha: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    aktif: 'bg-green-100 text-green-800',
    alumni: 'bg-gray-200 text-gray-700',
    belum_mulai: 'bg-blue-100 text-blue-800',
};

export function Badge({ value }: { value: string }) {
    return (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[value] ?? 'bg-gray-100'}`}>
            {value.replace('_', ' ')}
        </span>
    );
}