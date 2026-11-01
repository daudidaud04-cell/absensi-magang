import { Link, usePage } from '@inertiajs/react';
import { CalendarDays, ClipboardCheck, FileText, Home, User } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Simpan logo Anda di: public/images/logo-ptsi.png
 */
const LOGO_SRC = '/images/logo-ptsi.png';

const tabs = [
    { label: 'Beranda', href: '/absensi', icon: Home, match: (u: string) => u === '/absensi' || u.startsWith('/absensi/berhasil') },
    { label: 'Absen', href: '/absensi/absen', icon: ClipboardCheck, match: (u: string) => u.startsWith('/absensi/absen') },
    { label: 'Riwayat', href: '/riwayat', icon: CalendarDays, match: (u: string) => u.startsWith('/riwayat') },
    { label: 'Izin', href: '/izin', icon: FileText, match: (u: string) => u.startsWith('/izin') },
    { label: 'Profil', href: '/profil', icon: User, match: (u: string) => u.startsWith('/profil') },
];

export default function PesertaShell({ children }: { children: ReactNode }) {
    const url = usePage().url.split('?')[0];

    // Beranda dibuat lebar (2 kolom di komputer), halaman lain dibatasi agar nyaman dibaca
    const lebarKomputer = url === '/absensi' ? 'lg:max-w-6xl' : 'lg:max-w-2xl';

    return (
        <div className="min-h-dvh bg-orange-50 text-neutral-900">
            {/* ===== Sidebar: hanya di komputer ===== */}
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-orange-100 bg-white p-6 shadow-sm shadow-orange-900/5 lg:flex">
                <div className="mb-10 flex items-center gap-3">
                    <img src={LOGO_SRC} alt="Logo PTSI" className="h-10 w-auto object-contain" />
                    <div className="leading-tight">
                        <p className="text-base font-bold text-neutral-900">SIAM</p>
                        <p className="text-xs text-neutral-500">Absensi Magang</p>
                    </div>
                </div>

                <nav aria-label="Menu utama" className="flex flex-col gap-1">
                    {tabs.map((t) => {
                        const active = t.match(url);
                        return (
                            <Link
                                key={t.href}
                                href={t.href}
                                aria-current={active ? 'page' : undefined}
                                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                                    active
                                        ? 'bg-gradient-to-r from-[#f97316] to-[#ea580c] text-white shadow-md shadow-orange-500/30'
                                        : 'text-neutral-600 hover:bg-orange-50 hover:text-orange-600'
                                }`}
                            >
                                <t.icon className="h-5 w-5" />
                                {t.label}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* ===== Isi halaman ===== */}
            <main className="mx-auto max-w-lg px-4 pt-6 pb-[calc(7rem+env(safe-area-inset-bottom))] lg:ml-64 lg:max-w-none lg:px-10 lg:pt-10 lg:pb-10">
                <div className={`mx-auto w-full space-y-4 lg:space-y-6 ${lebarKomputer}`}>{children}</div>
            </main>

            {/* ===== Menu bawah: hanya di HP ===== */}
            <nav
                aria-label="Menu utama"
                className="fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
            >
                <div className="mx-auto flex max-w-lg justify-between rounded-full bg-white px-3 py-2 shadow-[0_4px_24px_rgba(194,65,12,0.18)]">
                    {tabs.map((t) => {
                        const active = t.match(url);
                        return (
                            <Link
                                key={t.href}
                                href={t.href}
                                aria-current={active ? 'page' : undefined}
                                className={`flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-xs transition active:scale-95 ${
                                    active ? 'font-semibold text-orange-600' : 'text-neutral-500'
                                }`}
                            >
                                <t.icon className={`h-5 w-5 ${active ? 'text-orange-600' : ''}`} />
                                {t.label}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}