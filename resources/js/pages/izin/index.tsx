import { Head, useForm } from '@inertiajs/react';
import { Send } from 'lucide-react';
import { useState } from 'react';
import { pBtn, pCard } from '@/components/siam/peserta-ui';
import type { LeaveRequest } from '@/components/siam/types';

const fieldCls =
    'block w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-base text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/25 sm:text-sm';

const fileCls =
    'block w-full rounded-xl border border-neutral-200 bg-white text-sm text-neutral-600 file:mr-3 file:cursor-pointer file:border-0 file:bg-orange-50 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-orange-700 hover:file:bg-orange-100';

const statusInfo: Record<string, { label: string; cls: string }> = {
    pending: { label: 'Menunggu', cls: 'bg-amber-100 text-amber-800' },
    approved: { label: 'Disetujui', cls: 'bg-green-100 text-green-700' },
    rejected: { label: 'Ditolak', cls: 'bg-red-100 text-red-700' },
};

const jenisInfo: Record<string, { label: string; cls: string }> = {
    izin: { label: 'Izin', cls: 'bg-blue-100 text-blue-700' },
    sakit: { label: 'Sakit', cls: 'bg-purple-100 text-purple-700' },
};

const fmtDate = (s: string) =>
    s ? new Date(`${s.slice(0, 10)}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '–';

const fmtRange = (a: string, b: string) => (a?.slice(0, 10) === b?.slice(0, 10) ? fmtDate(a) : `${fmtDate(a)} – ${fmtDate(b)}`);

function Pill({ info, fallback }: { info?: { label: string; cls: string }; fallback: string }) {
    return (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${info?.cls ?? 'bg-neutral-100 text-neutral-600'}`}>
            {info?.label ?? fallback}
        </span>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <label className="grid gap-1.5 text-sm font-medium text-neutral-700">
            {label}
            {children}
            {error && <span className="text-xs font-normal text-red-600">{error}</span>}
        </label>
    );
}

export default function IzinIndex({ requests }: { requests: LeaveRequest[] }) {
    const [fileKey, setFileKey] = useState(0);

    const form = useForm({
        type: 'izin',
        start_date: '',
        end_date: '',
        reason: '',
        proof_file: null as File | null,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/izin', {
            forceFormData: true,
            onSuccess: () => {
                form.reset();
                setFileKey((k) => k + 1); // kosongkan tampilan input file
            },
        });
    };

    return (
        <>
            <Head title="Izin / Sakit" />

            <h1 className="text-2xl font-bold">Izin / Sakit</h1>

            <section className={pCard}>
                <h2 className="mb-4 font-semibold">Ajukan Izin atau Sakit</h2>

                <form onSubmit={submit} className="grid gap-4">
                    <Field label="Jenis" error={form.errors.type}>
                        <select className={fieldCls} value={form.data.type} onChange={(e) => form.setData('type', e.target.value)}>
                            <option value="izin">Izin</option>
                            <option value="sakit">Sakit</option>
                        </select>
                    </Field>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Tanggal mulai" error={form.errors.start_date}>
                            <input
                                type="date"
                                className={fieldCls}
                                value={form.data.start_date}
                                onChange={(e) => form.setData('start_date', e.target.value)}
                            />
                        </Field>

                        <Field label="Tanggal selesai" error={form.errors.end_date}>
                            <input
                                type="date"
                                className={fieldCls}
                                value={form.data.end_date}
                                onChange={(e) => form.setData('end_date', e.target.value)}
                            />
                        </Field>
                    </div>

                    <Field label="Alasan" error={form.errors.reason}>
                        <textarea
                            className={fieldCls}
                            rows={3}
                            placeholder="Tuliskan alasan singkat"
                            value={form.data.reason}
                            onChange={(e) => form.setData('reason', e.target.value)}
                        />
                    </Field>

                    <Field label="Bukti" error={form.errors.proof_file}>
                        <input
                            key={fileKey}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className={fileCls}
                            onChange={(e) => form.setData('proof_file', e.target.files?.[0] ?? null)}
                        />
                        <span className="text-xs font-normal text-neutral-500">PDF, JPG, atau PNG, maksimal 2 MB. Wajib untuk sakit.</span>
                    </Field>

                    <button type="submit" disabled={form.processing} className={`${pBtn} disabled:opacity-60`}>
                        <Send className="h-5 w-5" />
                        {form.processing ? 'Mengirim...' : 'Kirim Pengajuan'}
                    </button>
                </form>
            </section>

            <section className={pCard}>
                <h2 className="mb-1 font-semibold">Riwayat Pengajuan</h2>

                <ul className="divide-y">
                    {requests.map((r) => (
                        <li key={r.id} className="space-y-1.5 py-3 text-sm">
                            <div className="flex flex-wrap items-center gap-2">
                                <Pill info={jenisInfo[r.type]} fallback={r.type} />
                                <Pill info={statusInfo[r.status]} fallback={r.status} />
                            </div>
                            <p className="font-medium">{fmtRange(r.start_date, r.end_date)}</p>
                            {r.review_notes && <p className="text-neutral-500">Catatan admin: {r.review_notes}</p>}
                        </li>
                    ))}
                    {!requests.length && <li className="py-3 text-sm text-neutral-500">Belum ada pengajuan.</li>}
                </ul>
            </section>
        </>
    );
}