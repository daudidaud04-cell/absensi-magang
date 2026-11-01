import SiamLayout from '@/components/siam/layout';
import { dangerRowBtn, fieldCls, focusRing, PageHeader, Panel, primaryBtn, rowBtn, SearchBox, secondaryBtn, StatusBadge } from '@/components/siam/kit';
import { Field } from '@/components/siam/ui';
import { router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

type Loc = {
    id: number;
    name: string;
    is_active: boolean;
    users_count: number;
};

type FormData = {
    name: string;
    is_active: boolean;
};

const empty: FormData = { name: '', is_active: true };

export default function Lokasi({ locations }: { locations: Loc[] }) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [q, setQ] = useState('');
    const form = useForm<FormData>(empty);

    const filtered = useMemo(() => {
        const key = q.trim().toLowerCase();
        if (!key) return locations;
        return locations.filter((l) => l.name.toLowerCase().includes(key));
    }, [locations, q]);

    const totalPeserta = locations.reduce((sum, l) => sum + l.users_count, 0);

    const openCreate = () => {
        setEditingId(null);
        form.setData(empty);
        form.clearErrors();
        setShowForm(true);
    };

    const startEdit = (l: Loc) => {
        setEditingId(l.id);
        form.setData({ name: l.name, is_active: l.is_active });
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
        if (editingId) form.put(`/admin/lokasi/${editingId}`, options);
        else form.post('/admin/lokasi', options);
    };

    const remove = (l: Loc) => {
        if (!confirm(`Hapus lokasi "${l.name}"?`)) return;
        router.delete(`/admin/lokasi/${l.id}`, {
            preserveScroll: true,
            onError: (errors) => alert(errors.delete ?? 'Gagal menghapus lokasi.'),
        });
    };

    return (
        <SiamLayout title="Lokasi Penempatan">
            <div className="@container space-y-5">
                {/* HEADER */}
                <PageHeader
                    title="Lokasi Penempatan"
                    subtitle={`${locations.length} lokasi · ${totalPeserta} peserta. Titik dan radius absen tetap satu (Training Center), diatur di menu Pengaturan.`}
                >
                    {!showForm && (
                        <button type="button" onClick={openCreate} className={primaryBtn}>
                            <Plus className="size-4" />
                            Tambah Lokasi
                        </button>
                    )}
                </PageHeader>

                {/* FORM (muncul saat tambah / edit) */}
                {showForm && (
                    <Panel title={editingId ? 'Edit Lokasi' : 'Tambah Lokasi'}>
                        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                            <Field label="Nama lokasi" error={form.errors.name}>
                                <input
                                    className={fieldCls}
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    autoFocus
                                />
                            </Field>

                            <label className="flex items-center gap-2 self-end pb-2 text-sm">
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
                        <SearchBox value={q} onChange={setQ} placeholder="Cari nama lokasi" />
                    </div>

                    {filtered.length === 0 ? (
                        <p className="py-10 text-center text-sm text-muted-foreground">
                            {locations.length === 0 ? 'Belum ada lokasi.' : 'Tidak ada lokasi yang cocok.'}
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b text-muted-foreground">
                                    <tr>
                                        <th className="w-12 pb-3 font-medium">No</th>
                                        <th className="pb-3 font-medium">Nama</th>
                                        <th className="px-3 pb-3 font-medium">Peserta</th>
                                        <th className="px-3 pb-3 font-medium">Status</th>
                                        <th className="pb-3 text-right font-medium">Aksi</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y">
                                    {filtered.map((l, i) => (
                                        <tr key={l.id} className="transition hover:bg-muted/50">
                                            <td className="py-3 pr-2 text-muted-foreground tabular-nums">{i + 1}</td>

                                            <td className="py-3 pr-3 font-medium">{l.name}</td>

                                            <td className="px-3 py-3 tabular-nums">{l.users_count}</td>

                                            <td className="px-3 py-3">
                                                <StatusBadge value={l.is_active ? 'aktif' : 'nonaktif'} />
                                            </td>

                                            <td className="py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button type="button" onClick={() => startEdit(l)} className={rowBtn}>
                                                        <Pencil className="size-3.5" />
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => remove(l)}
                                                        aria-label={`Hapus ${l.name}`}
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