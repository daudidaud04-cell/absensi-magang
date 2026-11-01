import SiamLayout from '@/components/siam/layout';
import { btnCls, Card, Field, inputCls } from '@/components/siam/ui';
import { Link, useForm } from '@inertiajs/react';

type Peserta = {
    id: number;
    name: string;
    email: string;
    nim_nis: string | null;
    phone: string | null;
    instansi: string | null;
    division_id: number | null;
    pembimbing: string | null;
    start_date: string | null;
    end_date: string | null;
    education_level: string | null;
    major: string | null;
    location_id: number | null;
    school_supervisor: string | null;
    guardian_phone: string | null;
    letter_number: string | null;
    certificate_number: string | null;
    certificate_date: string | null;
};

type Option = { id: number; name: string };
type DivisionOption = Option & { location_id: number };

type Key =
    | 'name'
    | 'email'
    | 'password'
    | 'education_level'
    | 'nim_nis'
    | 'phone'
    | 'guardian_phone'
    | 'instansi'
    | 'major'
    | 'division_id'
    | 'location_id'
    | 'pembimbing'
    | 'school_supervisor'
    | 'letter_number'
    | 'start_date'
    | 'end_date'
    | 'certificate_number'
    | 'certificate_date';

type FieldDef = {
    key: Key;
    label: string;
    type?: string;
    options?: [string, string][];
    hide?: boolean;
    onChangeExtra?: () => void;
};

const toOptions = (items: Option[]): [string, string][] => [['', '- pilih -'], ...items.map((o): [string, string] => [String(o.id), o.name])];

export default function PesertaForm({
    peserta,
    locations,
    divisions,
}: {
    peserta: Peserta | null;
    locations: Option[];
    divisions: DivisionOption[];
}) {
    const form = useForm<Record<Key, string>>({
        name: peserta?.name ?? '',
        email: peserta?.email ?? '',
        password: '',
        education_level: peserta?.education_level ?? 'perguruan_tinggi',
        nim_nis: peserta?.nim_nis ?? '',
        phone: peserta?.phone ?? '',
        guardian_phone: peserta?.guardian_phone ?? '',
        instansi: peserta?.instansi ?? '',
        major: peserta?.major ?? '',
        division_id: peserta?.division_id ? String(peserta.division_id) : '',
        location_id: peserta?.location_id ? String(peserta.location_id) : '',
        pembimbing: peserta?.pembimbing ?? '',
        school_supervisor: peserta?.school_supervisor ?? '',
        letter_number: peserta?.letter_number ?? '',
        start_date: peserta?.start_date ?? '',
        end_date: peserta?.end_date ?? '',
        certificate_number: peserta?.certificate_number ?? '',
        certificate_date: peserta?.certificate_date ?? '',
    });

    const smk = form.data.education_level === 'smk';
    const divisionChoices = divisions.filter((d) => String(d.location_id) === form.data.location_id);

    const fields: FieldDef[] = [
        { key: 'name', label: 'Nama lengkap' },
        { key: 'email', label: 'Email (untuk login)', type: 'email' },
        { key: 'password', label: 'Password (kosongkan jika tidak diubah)', type: 'password' },
        {
            key: 'education_level',
            label: 'Jenjang pendidikan',
            options: [
                ['perguruan_tinggi', 'Perguruan Tinggi'],
                ['smk', 'SMK'],
            ],
        },
        { key: 'instansi', label: smk ? 'Nama SMK' : 'Nama universitas' },
        { key: 'nim_nis', label: smk ? 'NISN' : 'NIM' },
        { key: 'major', label: smk ? 'Jurusan / kompetensi keahlian' : 'Program studi / fakultas' },
        { key: 'phone', label: 'No. HP' },
        { key: 'guardian_phone', label: 'No. HP orang tua / wali', hide: !smk },
        {
            key: 'location_id',
            label: 'Lokasi penempatan',
            options: toOptions(locations),
            onChangeExtra: () => form.setData('division_id', ''),
        },
        {
            key: 'division_id',
            label: form.data.location_id ? 'Divisi / unit' : 'Divisi / unit (pilih lokasi dulu)',
            options: toOptions(divisionChoices),
        },
        { key: 'pembimbing', label: 'Pembimbing lapangan (PTSI)' },
        { key: 'school_supervisor', label: smk ? 'Guru pembimbing' : 'Dosen pembimbing' },
        { key: 'letter_number', label: smk ? 'No. surat dari sekolah' : 'No. surat dari kampus' },
        { key: 'start_date', label: 'Tanggal mulai magang', type: 'date' },
        { key: 'end_date', label: 'Tanggal selesai magang', type: 'date' },
        { key: 'certificate_number', label: 'No. sertifikat', hide: !peserta },
        { key: 'certificate_date', label: 'Tanggal sertifikat', type: 'date', hide: !peserta },
    ];

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (peserta) form.put(`/admin/peserta/${peserta.id}`);
        else form.post('/admin/peserta');
    };

    return (
        <SiamLayout title={peserta ? 'Edit Peserta' : 'Tambah Peserta'}>
            <Card title={peserta ? 'Edit Peserta' : 'Tambah Peserta'}>
                <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
                    {fields
                        .filter((f) => !f.hide)
                        .map((f) => (
                            <Field key={f.key} label={f.label} error={form.errors[f.key]}>
                                {f.options ? (
                                    <select
                                        className={inputCls}
                                        value={form.data[f.key]}
                                        onChange={(e) => {
                                            form.setData(f.key, e.target.value);
                                            f.onChangeExtra?.();
                                        }}
                                    >
                                        {f.options.map(([value, text]) => (
                                            <option key={value} value={value}>
                                                {text}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type={f.type ?? 'text'}
                                        className={inputCls}
                                        value={form.data[f.key]}
                                        onChange={(e) => form.setData(f.key, e.target.value)}
                                    />
                                )}
                            </Field>
                        ))}
                    <div className="flex gap-2 sm:col-span-2">
                        <button className={btnCls} disabled={form.processing}>
                            Simpan
                        </button>
                        <Link href="/admin/peserta" className="rounded-md border px-4 py-2 text-sm">
                            Batal
                        </Link>
                    </div>
                </form>
            </Card>
        </SiamLayout>
    );
}