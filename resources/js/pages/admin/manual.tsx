import SiamLayout from '@/components/siam/layout';
import { fieldCls, PageHeader, Panel, primaryBtn } from '@/components/siam/kit';
import { Field } from '@/components/siam/ui';
import { useForm } from '@inertiajs/react';
import { Save } from 'lucide-react';

const statusOptions = [
    ['hadir', 'Hadir'],
    ['terlambat', 'Terlambat'],
    ['izin', 'Izin'],
    ['sakit', 'Sakit'],
    ['alpha', 'Alpha'],
] as const;

const areaCls = 'w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/60';

export default function Manual({ pesertas }: { pesertas: { id: number; name: string }[] }) {
    const form = useForm({
        user_id: '',
        date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD, waktu lokal
        status: 'hadir',
        time_in: '',
        time_out: '',
        logbook: '',
        admin_notes: '',
    });

    const set =
        (k: keyof typeof form.data) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
            form.setData(k, e.target.value);

    return (
        <SiamLayout title="Absen Manual">
            <div className="@container space-y-5">
                <PageHeader
                    title="Absen Manual"
                    subtitle="Gunakan jika ada kendala teknis, dinas luar, atau peserta lupa absen pulang. Alasan wajib diisi dan tercatat."
                />

                <Panel title="Override Admin">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.post('/admin/manual');
                        }}
                        className="grid gap-4 sm:grid-cols-2"
                    >
                        <Field label="Peserta" error={form.errors.user_id}>
                            <select className={fieldCls} value={form.data.user_id} onChange={set('user_id')}>
                                <option value="">-- pilih --</option>
                                {pesertas.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Tanggal" error={form.errors.date}>
                            <input type="date" className={fieldCls} value={form.data.date} onChange={set('date')} />
                        </Field>

                        <Field label="Status" error={form.errors.status}>
                            <select className={fieldCls} value={form.data.status} onChange={set('status')}>
                                {statusOptions.map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Jam masuk" error={form.errors.time_in}>
                                <input type="time" className={fieldCls} value={form.data.time_in} onChange={set('time_in')} />
                            </Field>

                            <Field label="Jam pulang" error={form.errors.time_out}>
                                <input type="time" className={fieldCls} value={form.data.time_out} onChange={set('time_out')} />
                            </Field>
                        </div>

                        <div className="sm:col-span-2">
                            <Field label="Jurnal (opsional)" error={form.errors.logbook}>
                                <textarea className={areaCls} rows={2} value={form.data.logbook} onChange={set('logbook')} />
                            </Field>
                        </div>

                        <div className="sm:col-span-2">
                            <Field label="Alasan admin (wajib)" error={form.errors.admin_notes}>
                                <textarea
                                    className={areaCls}
                                    rows={2}
                                    value={form.data.admin_notes}
                                    onChange={set('admin_notes')}
                                />
                            </Field>
                        </div>

                        <div className="sm:col-span-2">
                            <button className={primaryBtn} disabled={form.processing}>
                                <Save className="size-4" />
                                {form.processing ? 'Menyimpan…' : 'Simpan'}
                            </button>
                        </div>
                    </form>
                </Panel>
            </div>
        </SiamLayout>
    );
}