import SiamLayout from '@/components/siam/layout';
import { fieldCls, PageHeader, Panel, primaryBtn } from '@/components/siam/kit';
import SearchableSelect from '@/components/siam/searchable-select';
import { Field } from '@/components/siam/ui';
import { useForm } from '@inertiajs/react';
import { Save } from 'lucide-react';
import { useMemo } from 'react';

const statusOptions = [
    ['hadir', 'Hadir'],
    ['terlambat', 'Terlambat'],
    ['izin', 'Izin'],
    ['sakit', 'Sakit'],
    ['alpha', 'Alpha'],
] as const;

const areaCls = 'w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/60';

type Peserta = {
    id: number;
    name: string;
    email: string | null;
    instansi: string | null;
};

export default function Manual({ pesertas }: { pesertas: Peserta[] }) {
    const form = useForm({
        user_id: '',
        date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD, waktu lokal
        date_end: '',
        status: 'hadir',
        time_in: '',
        time_out: '',
        logbook: '',
        admin_notes: '',
    });

    // Jam hanya relevan untuk hadir/terlambat
    const needsTime = form.data.status === 'hadir' || form.data.status === 'terlambat';
    const isRange = form.data.date_end !== '' && form.data.date_end > form.data.date;

    const set =
        (k: keyof typeof form.data) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
            form.setData(k, e.target.value);

    const onStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const status = e.target.value;
        const keepTime = status === 'hadir' || status === 'terlambat';
        form.setData((d) => ({ ...d, status, ...(keepTime ? {} : { time_in: '', time_out: '' }) }));
    };

    const onDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const date = e.target.value;
        // Tanggal akhir tidak boleh lebih awal dari tanggal mulai
        form.setData((d) => ({ ...d, date, date_end: d.date_end && d.date_end < date ? '' : d.date_end }));
    };

    // Email dan sekolah ikut ditampilkan supaya nama kembar tidak tertukar
    const options = useMemo(
        () =>
            pesertas.map((p) => ({
                value: p.id,
                label: p.name,
                hint: [p.email, p.instansi].filter(Boolean).join(' · '),
            })),
        [pesertas],
    );

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/admin/manual', {
            preserveScroll: true,
            // Semua dikosongkan kecuali tanggal, supaya admin bisa langsung input peserta berikutnya
            onSuccess: () => form.reset('user_id', 'date_end', 'status', 'time_in', 'time_out', 'logbook', 'admin_notes'),
        });
    };

    return (
        <SiamLayout title="Absen Manual">
            <div className="@container space-y-5">
                <PageHeader
                    title="Absen Manual"
                    subtitle="Gunakan jika ada kendala teknis, dinas luar, atau peserta lupa absen pulang. Alasan wajib diisi dan tercatat."
                />

                <Panel title="Override Admin">
                    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <Field label="Peserta" error={form.errors.user_id}>
                                <SearchableSelect
                                    options={options}
                                    value={form.data.user_id}
                                    onChange={(v) => form.setData('user_id', v)}
                                    placeholder="Ketik nama peserta..."
                                />
                            </Field>
                        </div>

                        <Field label="Tanggal" error={form.errors.date}>
                            <input type="date" className={fieldCls} value={form.data.date} onChange={onDateChange} required />
                        </Field>

                        <Field label="Sampai tanggal (opsional)" error={form.errors.date_end}>
                            <input
                                type="date"
                                className={fieldCls}
                                value={form.data.date_end}
                                min={form.data.date}
                                onChange={set('date_end')}
                            />
                        </Field>

                        <div className="sm:col-span-2">
                            <p className="text-xs text-muted-foreground">
                                {isRange
                                    ? 'Satu catatan dibuat per hari kerja (maks. 31 hari). Hari libur, hari non-kerja, dan tanggal yang sudah punya absen akan dilewati, tidak ditimpa.'
                                    : 'Kosongkan "Sampai tanggal" untuk satu hari saja. Jika tanggal itu sudah punya absen, datanya akan diganti.'}
                            </p>
                        </div>

                        <div className="sm:col-span-2">
                            <Field label="Status" error={form.errors.status}>
                                <select className={fieldCls} value={form.data.status} onChange={onStatusChange}>
                                    {statusOptions.map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                        </div>

                        <Field label="Jam masuk" error={form.errors.time_in}>
                            <input
                                type="time"
                                className={fieldCls}
                                value={form.data.time_in}
                                onChange={set('time_in')}
                                disabled={!needsTime}
                                required={needsTime}
                            />
                        </Field>

                        <Field label="Jam pulang" error={form.errors.time_out}>
                            <input
                                type="time"
                                className={fieldCls}
                                value={form.data.time_out}
                                min={form.data.time_in || undefined}
                                onChange={set('time_out')}
                                disabled={!needsTime}
                            />
                        </Field>

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
                                    required
                                />
                            </Field>
                        </div>

                        <div className="sm:col-span-2">
                            <button type="submit" className={primaryBtn} disabled={form.processing || !form.data.user_id}>
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