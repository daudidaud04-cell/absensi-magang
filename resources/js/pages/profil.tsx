import { Head, Link, router, usePage } from '@inertiajs/react';
import { ChevronRight, LogOut } from 'lucide-react';
import { pCard } from '@/components/siam/peserta-ui';

type Shared = {
    auth: {
        user: {
            name: string;
            email: string;
            instansi?: string | null;
            lokasi?: string | null;
            pembimbing?: string | null;
            start_date?: string | null;
            end_date?: string | null;
        };
    };
};

export default function Profil() {
    const { user } = usePage<Shared>().props.auth;

    const rows: [string, string | null | undefined][] = [
        ['Instansi', user.instansi],
        ['Lokasi penempatan', user.lokasi],
        ['Pembimbing', user.pembimbing],
        ['Periode magang', user.start_date && user.end_date ? `${user.start_date} s.d. ${user.end_date}` : null],
    ];

    return (
        <>
            <Head title="Profil" />
            <h1 className="text-2xl font-bold">Profil Saya</h1>

            <section className={`${pCard} flex flex-col items-center gap-1 text-center`}>
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-2xl font-bold text-orange-700">
                    {user.name.charAt(0).toUpperCase()}
                </span>
                <p className="mt-2 text-lg font-semibold">{user.name}</p>
                <p className="text-sm text-neutral-500">{user.email}</p>
            </section>

            <section className={pCard}>
                <dl className="divide-y text-sm">
                    {rows.map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-4 py-3">
                            <dt className="text-neutral-500">{k}</dt>
                            <dd className="text-right font-medium">{v || '-'}</dd>
                        </div>
                    ))}
                </dl>
            </section>

            <Link href="/settings/security" className={`${pCard} flex items-center justify-between`}>
                <span>
                    <span className="block font-medium">Ganti Kata Sandi</span>
                    <span className="text-sm text-neutral-500">Perbarui kata sandi akunmu</span>
                </span>
                <ChevronRight className="h-5 w-5 text-neutral-400" />
            </Link>

            <button
                className="flex w-full items-center justify-center gap-2 rounded-full border border-red-300 bg-white py-3 text-sm font-medium text-red-600"
                onClick={() => router.post('/logout')}
            >
                <LogOut className="h-4 w-4" /> Keluar
            </button>
        </>
    );
}