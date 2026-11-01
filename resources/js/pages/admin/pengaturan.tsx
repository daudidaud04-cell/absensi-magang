import OfficeMap from '@/components/siam/OfficeMap';
import SiamLayout from '@/components/siam/layout';
import { dangerRowBtn, fieldCls, PageHeader, Panel, primaryBtn, secondaryBtn } from '@/components/siam/kit';
import { Field } from '@/components/siam/ui';
import { Link, router, useForm } from '@inertiajs/react';
import { CalendarDays, LocateFixed, Plus, Save, Trash2 } from 'lucide-react';

type Office = {
    name: string;
    latitude: number;
    longitude: number;
    radius_meter: number;
    jam_masuk: string;
    jam_pulang: string;
    pulang_dibuka_menit: number;
    toleransi_terlambat_menit: number;
    max_gps_accuracy_meter: number;
} | null;

type Holiday = { id: number; date: string; name: string };

type FieldDef = { key: string; label: string; type?: string };

const fmtDate = (s: string) =>
    s ? new Date(`${s.slice(0, 10)}T00:00:00`).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '–';

const groupLokasi: FieldDef[] = [
    { key: 'name', label: 'Nama lokasi' },
    { key: 'radius_meter', label: 'Radius absen (meter)', type: 'number' },
    { key: 'latitude', label: 'Latitude', type: 'number' },
    { key: 'longitude', label: 'Longitude', type: 'number' },
];

const groupJam: FieldDef[] = [
    { key: 'jam_masuk', label: 'Jam masuk', type: 'time' },
    { key: 'jam_pulang', label: 'Jam pulang', type: 'time' },
    { key: 'pulang_dibuka_menit', label: 'Absen pulang dibuka (menit sebelum jam pulang)', type: 'number' },
];

const groupToleransi: FieldDef[] = [
    { key: 'toleransi_terlambat_menit', label: 'Toleransi terlambat (menit)', type: 'number' },
    { key: 'max_gps_accuracy_meter', label: 'Akurasi GPS maksimum (meter)', type: 'number' },
];

export default function Pengaturan({ office, holidays }: { office: Office; holidays: Holiday[] }) {
    const form = useForm({
        name: office?.name ?? 'Training Center RAPP',
        latitude: String(office?.latitude ?? ''),
        longitude: String(office?.longitude ?? ''),
        radius_meter: String(office?.radius_meter ?? 50),
        jam_masuk: (office?.jam_masuk ?? '08:00').slice(0, 5),
        jam_pulang: (office?.jam_pulang ?? '17:00').slice(0, 5),
        pulang_dibuka_menit: String(office?.pulang_dibuka_menit ?? 30),
        toleransi_terlambat_menit: String(office?.toleransi_terlambat_menit ?? 15),
        max_gps_accuracy_meter: String(office?.max_gps_accuracy_meter ?? 50),
    });
    const holiday = useForm({ date: '', name: '' });

    type Key = keyof typeof form.data;

    const set = (k: Key) => (e: React.ChangeEvent<HTMLInputElement>) => form.setData(k, e.target.value);

    const lat = parseFloat(form.data.latitude);
    const lng = parseFloat(form.data.longitude);
    const radius = parseFloat(form.data.radius_meter);
    const mapReady = Number.isFinite(lat) && Number.isFinite(lng);

    const useMyLocation = () =>
        navigator.geolocation.getCurrentPosition(
            (p) => {
                form.setData('latitude', String(p.coords.latitude));
                form.setData('longitude', String(p.coords.longitude));
            },
            () => alert('Lokasi tidak dapat diambil. Izinkan akses lokasi.'),
            { enableHighAccuracy: true },
        );

    const renderFields = (defs: FieldDef[]) =>
        defs.map((f) => (
            <Field key={f.key} label={f.label} error={form.errors[f.key as Key]}>
                <input
                    type={f.type ?? 'text'}
                    step="any"
                    className={fieldCls}
                    value={form.data[f.key as Key]}
                    onChange={set(f.key as Key)}
                />
            </Field>
        ));

    const subTitle = 'text-sm font-semibold text-muted-foreground';

    return (
        <SiamLayout title="Pengaturan">
            <div className="@container space-y-5">
                <PageHeader title="Pengaturan" subtitle="Kantor, titik dan radius absen, jam kerja, serta hari libur.">
                    <Link href="/admin/jadwal" className={secondaryBtn}>
                        <CalendarDays className="size-4" />
                        Buka Jadwal Kerja
                    </Link>
                </PageHeader>

                {/* KANTOR */}
                <Panel title="Pengaturan Kantor">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.put('/admin/pengaturan/kantor', { preserveScroll: true });
                        }}
                        className="space-y-6"
                    >
                        <div className="space-y-3">
                            <h3 className={subTitle}>Lokasi absen</h3>
                            <div className="grid gap-4 sm:grid-cols-2">{renderFields(groupLokasi)}</div>
                        </div>

                        <div className="space-y-3">
                            <h3 className={subTitle}>Jam kerja</h3>
                            <div className="grid gap-4 sm:grid-cols-2">{renderFields(groupJam)}</div>
                        </div>

                        <div className="space-y-3">
                            <h3 className={subTitle}>Toleransi</h3>
                            <div className="grid gap-4 sm:grid-cols-2">{renderFields(groupToleransi)}</div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button className={primaryBtn} disabled={form.processing}>
                                <Save className="size-4" />
                                {form.processing ? 'Menyimpan…' : 'Simpan'}
                            </button>

                            <button type="button" className={secondaryBtn} onClick={useMyLocation}>
                                <LocateFixed className="size-4" />
                                Pakai lokasi saya sekarang
                            </button>
                        </div>
                    </form>

                    {mapReady && (
                        <div className="mt-6 space-y-2">
                            <OfficeMap
                                lat={lat}
                                lng={lng}
                                radius={Number.isFinite(radius) ? radius : 0}
                                onPick={(la, ln) => {
                                    form.setData('latitude', la.toFixed(7));
                                    form.setData('longitude', ln.toFixed(7));
                                }}
                            />
                            <p className="text-xs text-muted-foreground">
                                Lingkaran biru = area absen. Klik peta untuk memindahkan titik kantor, lalu tekan Simpan.
                            </p>
                        </div>
                    )}
                </Panel>

                {/* HARI LIBUR */}
                <Panel title="Hari Libur">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            holiday.post('/admin/pengaturan/libur', {
                                preserveScroll: true,
                                onSuccess: () => holiday.reset(),
                            });
                        }}
                        className="mb-5 flex flex-wrap items-end gap-3"
                    >
                        <Field label="Tanggal" error={holiday.errors.date}>
                            <input
                                type="date"
                                className={fieldCls}
                                value={holiday.data.date}
                                onChange={(e) => holiday.setData('date', e.target.value)}
                            />
                        </Field>

                        <Field label="Keterangan" error={holiday.errors.name}>
                            <input
                                className={fieldCls}
                                value={holiday.data.name}
                                onChange={(e) => holiday.setData('name', e.target.value)}
                            />
                        </Field>

                        <button className={primaryBtn} disabled={holiday.processing}>
                            <Plus className="size-4" />
                            Tambah
                        </button>
                    </form>

                    {holidays.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">Belum ada hari libur.</p>
                    ) : (
                        <ul className="divide-y rounded-xl border">
                            {holidays.map((h) => (
                                <li key={h.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                                    <div className="min-w-0">
                                        <p className="font-medium">{h.name}</p>
                                        <p className="text-xs text-muted-foreground tabular-nums">{fmtDate(h.date)}</p>
                                    </div>

                                    <button
                                        type="button"
                                        aria-label={`Hapus ${h.name}`}
                                        className={dangerRowBtn}
                                        onClick={() => {
                                            if (!confirm(`Hapus hari libur "${h.name}"?`)) return;
                                            router.delete(`/admin/pengaturan/libur/${h.id}`, { preserveScroll: true });
                                        }}
                                    >
                                        <Trash2 className="size-3.5" />
                                        Hapus
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>
            </div>
        </SiamLayout>
    );
}