import SiamLayout from '@/components/siam/layout';
import { fieldCls, focusRing, PageHeader, Panel, primaryBtn, SearchBox } from '@/components/siam/kit';
import { Field } from '@/components/siam/ui';
import { router, useForm } from '@inertiajs/react';
import { Save } from 'lucide-react';
import { useMemo, useState } from 'react';

type Peserta = { id: number; name: string; email: string; work_pattern: string };
type Sabtu = { tanggal: string; label: string; a: boolean; b: boolean; libur: string | null };

type Props = { anchor: string; pesertas: Peserta[]; sabtu: Sabtu[] };

const polaLabel: Record<string, string> = {
    weekday: 'Sabtu libur (Senin-Jumat)',
    saturday_a: 'Sabtu selang-seling A',
    saturday_b: 'Sabtu selang-seling B',
};

const polaStyle: Record<string, string> = {
    weekday: 'border-slate-200 bg-slate-50 text-slate-700',
    saturday_a: 'border-sky-200 bg-sky-50 text-sky-800',
    saturday_b: 'border-violet-200 bg-violet-50 text-violet-800',
};

function Masuk({ ya, libur }: { ya: boolean; libur: boolean }) {
    if (libur) return <span className="text-xs text-muted-foreground">Libur</span>;

    return ya ? (
        <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 ring-1 ring-green-200">
            Masuk
        </span>
    ) : (
        <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
            Libur
        </span>
    );
}

export default function Jadwal({ anchor, pesertas, sabtu }: Props) {
    const acuan = useForm({ saturday_anchor: anchor.slice(0, 10) });

    const [q, setQ] = useState('');
    const [filter, setFilter] = useState('semua');

    const hitung = useMemo(
        () => ({
            weekday: pesertas.filter((p) => p.work_pattern === 'weekday').length,
            saturday_a: pesertas.filter((p) => p.work_pattern === 'saturday_a').length,
            saturday_b: pesertas.filter((p) => p.work_pattern === 'saturday_b').length,
        }),
        [pesertas],
    );

    const tampil = useMemo(() => {
        const key = q.trim().toLowerCase();

        return pesertas.filter(
            (p) =>
                (filter === 'semua' || p.work_pattern === filter) &&
                (!key || p.name.toLowerCase().includes(key) || p.email.toLowerCase().includes(key)),
        );
    }, [pesertas, q, filter]);

    const ubahPola = (id: number, work_pattern: string) =>
        router.patch(`/admin/jadwal/${id}`, { work_pattern }, { preserveScroll: true });

    return (
        <SiamLayout title="Jadwal Kerja">
            <div className="@container space-y-5">
                {/* HEADER */}
                <PageHeader
                    title="Jadwal Kerja"
                    subtitle={`${pesertas.length} peserta · Kelompok A ${hitung.saturday_a} · Kelompok B ${hitung.saturday_b} · Sabtu libur ${hitung.weekday}`}
                />

                {/* SABTU ACUAN */}
                <Panel title="Sabtu Acuan">
                    <p className="mb-4 text-sm text-muted-foreground">
                        Pilih satu hari Sabtu yang <b className="text-foreground">pasti masuk</b> untuk kelompok A. Sabtu
                        berikutnya masuk untuk kelompok B, lalu kelompok A lagi, dan seterusnya. Tanggal ini sebaiknya
                        ditanyakan ke HRD.
                    </p>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            acuan.put('/admin/jadwal/acuan', { preserveScroll: true });
                        }}
                        className="flex flex-wrap items-end gap-3"
                    >
                        <Field label="Tanggal Sabtu acuan (kelompok A masuk)" error={acuan.errors.saturday_anchor}>
                            <input
                                type="date"
                                className={fieldCls}
                                value={acuan.data.saturday_anchor}
                                onChange={(e) => acuan.setData('saturday_anchor', e.target.value)}
                            />
                        </Field>

                        <button className={primaryBtn} disabled={acuan.processing}>
                            <Save className="size-4" />
                            {acuan.processing ? 'Menyimpan…' : 'Simpan'}
                        </button>
                    </form>
                </Panel>

                {/* PRATINJAU */}
                <Panel title="Pratinjau 8 Sabtu ke Depan">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b text-muted-foreground">
                                <tr>
                                    <th className="pb-3 font-medium">Tanggal</th>
                                    <th className="px-3 pb-3 text-center font-medium">Kelompok A</th>
                                    <th className="px-3 pb-3 text-center font-medium">Kelompok B</th>
                                    <th className="pb-3 font-medium">Keterangan</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y">
                                {sabtu.map((s) => (
                                    <tr key={s.tanggal} className="transition hover:bg-muted/50">
                                        <td className="py-3 pr-3 font-medium">{s.label}</td>
                                        <td className="px-3 py-3 text-center">
                                            <Masuk ya={s.a} libur={!!s.libur} />
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            <Masuk ya={s.b} libur={!!s.libur} />
                                        </td>
                                        <td className="py-3 text-xs text-muted-foreground">
                                            {s.libur ? `Hari libur: ${s.libur}` : ''}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Panel>

                {/* POLA KERJA PESERTA */}
                <Panel title="Pola Kerja Peserta">
                    <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium">
                        <span className={`rounded-full border px-2.5 py-1 ${polaStyle.weekday}`}>
                            Sabtu libur: {hitung.weekday}
                        </span>
                        <span className={`rounded-full border px-2.5 py-1 ${polaStyle.saturday_a}`}>
                            Kelompok A: {hitung.saturday_a}
                        </span>
                        <span className={`rounded-full border px-2.5 py-1 ${polaStyle.saturday_b}`}>
                            Kelompok B: {hitung.saturday_b}
                        </span>
                    </div>

                    <div className="mb-4 flex flex-wrap items-center gap-3">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className={`h-10 rounded-xl border bg-background px-3 text-sm ${focusRing}`}
                        >
                            <option value="semua">Semua pola</option>
                            <option value="weekday">{polaLabel.weekday}</option>
                            <option value="saturday_a">{polaLabel.saturday_a}</option>
                            <option value="saturday_b">{polaLabel.saturday_b}</option>
                        </select>

                        <SearchBox value={q} onChange={setQ} placeholder="Cari nama atau email peserta" />
                    </div>

                    {tampil.length === 0 ? (
                        <p className="py-10 text-center text-sm text-muted-foreground">
                            Tidak ada peserta yang cocok.
                        </p>
                    ) : (
                        <ul className="max-h-[32rem] divide-y overflow-y-auto rounded-xl border text-sm">
                            {tampil.map((p) => (
                                <li
                                    key={p.id}
                                    className="flex flex-wrap items-center justify-between gap-2 p-3 transition hover:bg-muted/50"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                            {p.name.charAt(0).toUpperCase()}
                                        </span>

                                        <div className="min-w-0">
                                            <p className="font-medium">{p.name}</p>
                                            <p className="text-xs text-muted-foreground">{p.email}</p>
                                        </div>
                                    </div>

                                    <select
                                        value={p.work_pattern}
                                        onChange={(e) => ubahPola(p.id, e.target.value)}
                                        className={`h-9 rounded-lg border px-2.5 text-xs font-medium ${focusRing} ${
                                            polaStyle[p.work_pattern] ?? polaStyle.weekday
                                        }`}
                                    >
                                        <option value="weekday">{polaLabel.weekday}</option>
                                        <option value="saturday_a">{polaLabel.saturday_a}</option>
                                        <option value="saturday_b">{polaLabel.saturday_b}</option>
                                    </select>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>
            </div>
        </SiamLayout>
    );
}