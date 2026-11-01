import SiamLayout from '@/components/siam/layout';
import { dangerRowBtn, fieldCls, PageHeader, Panel, primaryBtn, rowBtn, SearchBox, secondaryBtn, StatusBadge } from '@/components/siam/kit';
import { Field } from '@/components/siam/ui';
import { router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

type Div = {
    id: number;
    name: string;
    location_id: number;
    location: { id: number; name: string };
    is_active: boolean;
    users_count: number;
};

type Loc = { id: number; name: string };

type FormData = {
    location_id: string;
    name: string;
    is_active: boolean;
};

const empty: FormData = { location_id: '', name: '', is_active: true };

export default function Divisi({ divisions, locations }: { divisions: Div[]; locations: Loc[] }) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [q, setQ] = useState('');
    const [lokasiFilter, setLokasiFilter] = useState('semua');
    const form = useForm<FormData>(empty);

    const filtered = useMemo(() => {
        const key = q.trim().toLowerCase();

        return divisions.filter((d) => {
            const cocokLokasi = lokasiFilter === 'semua' || String(d.location_id) === lokasiFilter;
            const cocokCari =
                !key || d.name.toLowerCase().includes(key) || (d.location?.name ?? '').toLowerCase().includes(key);

            return cocokLokasi && cocokCari;
        });
    }, [divisions, q, lokasiFilter]);

    const totalPeserta = divisions.reduce((sum, d) => sum + d.users_count, 0);

    const openCreate = () => {
        setEditingId(null);
        form.setData(empty);
        form.clearErrors();
        setShowForm(true);
    };

    const startEdit = (d: Div) => {
        setEditingId(d.id);
        form.setData({ location_id: String(d.location_id), name: d.name, is_active: d.is_active });
        form.clearErrors();
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancel = () => {
        setEditingId(null);
        setShowForm(false);
        form.setData(empty);
        form.clearErrors();
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const options = { preserveScroll: true, onSuccess: cancel };
        if (editingId) form.put(`/admin/divisi/${editingId}`, options);
        else form.post('/admin/divisi', options);
    };

    const remove = (d: Div) => {
        if (!confirm(`Hapus divisi "${d.name}"?`)) return;
        router.delete(`/admin/divisi/${d.id}`, {
            preserveScroll: true,
            onError: (errors) => alert(errors.delete ?? 'Gagal menghapus divisi.'),
        });
    };

    return (
        <SiamLayout title="Divisi / Unit">
            <div className="@container space-y-5">
                {/* HEADER */}
                <PageHeader title="Divisi / Unit" subtitle={`${divisions.length} divisi · ${totalPeserta} peserta`}>
                    {!showForm && (
                        <button type="button" onClick={openCreate} className={primaryBtn}>
                            <Plus className="size-4" />
                            Tambah Divisi
                        </button>
                    )}
                </PageHeader>

                {/* FORM */}
                {showForm && (
                    <Panel title={editingId ? 'Edit Divisi' : 'Tambah Divisi'}>
                        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                            <Field label="Lokasi" error={form.errors.location_id}>
                                <select
                                    className={fieldCls}
                                    value={form.data.location_id}
                                    onChange={(e) => form.setData('location_id', e.target.value)}
                                >
                                    <option value="">- pilih lokasi -</option>
                                    {locations.map((l) => (
                                        <option key={l.id} value={l.id}>
                                            {l.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Nama divisi / unit" error={form.errors.name}>
                                <input
                                    className={fieldCls}
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                />
                            </Field>

                            <label className="flex items-center gap-2 text-sm sm:col-span-2">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_active}
                                    onChange={(e) => form.setData('is_active', e.target.checked)}
                                    className="size-4"
                                />
                                Aktif (bisa dipilih untuk peserta baru)
                            </label>

                            <div className="flex gap-2 sm:col-span-2">
                                <button className={primaryBtn} disabled={form.processing}>
                                    {editingId ? 'Simpan perubahan' : 'Tambah'}
                                </button>

                                <button type="button" onClick={cancel} className={secondaryBtn}>
                                    Batal
                                </button>
                            </div>
                        </form>
                    </Panel>
                )}

                {/* TABEL */}
                <Panel>
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                        <select
                            value={lokasiFilter}
                            onChange={(e) => setLokasiFilter(e.target.value)}
                            className="h-10 rounded-xl border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                        >
                            <option value="semua">Semua lokasi</option>
                            {locations.map((l) => (
                                <option key={l.id} value={l.id}>
                                    {l.name}
                                </option>
                            ))}
                        </select>

                        <SearchBox value={q} onChange={setQ} placeholder="Cari divisi atau lokasi" />
                    </div>

                    {filtered.length === 0 ? (
                        <p className="py-10 text-center text-sm text-muted-foreground">
                            {divisions.length === 0 ? 'Belum ada divisi.' : 'Tidak ada divisi yang cocok.'}
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b text-muted-foreground">
                                    <tr>
                                        <th className="w-12 pb-3 font-medium">No</th>
                                        <th className="pb-3 font-medium">Lokasi</th>
                                        <th className="px-3 pb-3 font-medium">Divisi / Unit</th>
                                        <th className="px-3 pb-3 font-medium">Peserta</th>
                                        <th className="px-3 pb-3 font-medium">Status</th>
                                        <th className="pb-3 text-right font-medium">Aksi</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y">
                                    {filtered.map((d, i) => (
                                        <tr key={d.id} className="transition hover:bg-muted/50">
                                            <td className="py-3 pr-2 text-muted-foreground tabular-nums">{i + 1}</td>

                                            <td className="py-3 pr-3">{d.location?.name ?? '–'}</td>

                                            <td className="px-3 py-3 font-medium">{d.name}</td>

                                            <td className="px-3 py-3 tabular-nums">{d.users_count}</td>

                                            <td className="px-3 py-3">
                                                <StatusBadge value={d.is_active ? 'aktif' : 'nonaktif'} />
                                            </td>

                                            <td className="py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button type="button" onClick={() => startEdit(d)} className={rowBtn}>
                                                        <Pencil className="size-3.5" />
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => remove(d)}
                                                        aria-label={`Hapus ${d.name}`}
                                                        className={dangerRowBtn}
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                        Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Panel>
            </div>
        </SiamLayout>
    );
}