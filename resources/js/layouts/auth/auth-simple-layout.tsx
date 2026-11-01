import type { PropsWithChildren } from 'react';

/**
 * Simpan logo Anda di: public/images/logo-ptsi.png
 */
const LOGO_SRC = '/images/logo-ptsi.png';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: PropsWithChildren<{ title?: string; description?: string }>) {
    return (
        <div className="min-h-svh w-full bg-orange-50 md:flex md:items-center md:justify-center md:p-8">
            <div className="relative mx-auto flex min-h-svh w-full max-w-5xl flex-col overflow-hidden bg-white md:min-h-[620px] md:flex-row md:rounded-[2rem] md:shadow-2xl md:shadow-orange-900/15">
                {/* ===== Panel oranye (atas di HP, kiri di komputer) ===== */}
                <section className="relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#fb923c] via-[#f97316] to-[#c2410c] px-8 pt-12 pb-28 text-center text-white md:w-1/2 md:py-16 md:pb-16">
                    {/* Aksen lingkaran lembut */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -top-16 -left-16 size-56 rounded-full bg-white/10"
                    />
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -bottom-20 left-10 size-64 rounded-full bg-white/10"
                    />
                    <div
                        aria-hidden
                        className="pointer-events-none absolute top-1/3 -right-10 size-32 rounded-full bg-white/10"
                    />

                    <p className="relative text-lg font-medium text-white/95 md:text-2xl">
                        Selamat datang di
                    </p>

                    <div className="relative mt-6 flex size-28 items-center justify-center rounded-full bg-white shadow-xl shadow-orange-900/25 ring-8 ring-white/25 md:size-32">
                        <img
                            src={LOGO_SRC}
                            alt="Logo PTSI"
                            className="h-14 w-auto object-contain md:h-16"
                        />
                    </div>

                    <h1 className="relative mt-6 text-2xl font-bold tracking-tight md:text-3xl">
                        SIAM
                    </h1>
                    <p className="relative mt-2 max-w-xs text-sm leading-relaxed text-white/95">
                        Sistem Informasi Absensi Magang. Catat kehadiran, lihat
                        riwayat, dan ajukan izin dengan mudah.
                    </p>

                    {/* Gelombang awan: HP (bawah) */}
                    <svg
                        aria-hidden
                        viewBox="0 0 400 70"
                        preserveAspectRatio="none"
                        className="absolute bottom-0 left-0 h-14 w-full md:hidden"
                    >
                        <path
                            d="M0 70V38C40 8 85 56 140 32S250 4 305 30 380 44 400 22V70Z"
                            fill="white"
                            opacity="0.35"
                        />
                        <path
                            d="M0 70V50C50 22 95 64 155 44S265 18 320 42 385 52 400 36V70Z"
                            fill="white"
                        />
                    </svg>

                    {/* Gelombang awan: komputer (sisi kanan) */}
                    <svg
                        aria-hidden
                        viewBox="0 0 70 400"
                        preserveAspectRatio="none"
                        className="absolute top-0 right-0 hidden h-full w-14 md:block"
                    >
                        <path
                            d="M70 0H38C8 40 56 85 32 140S4 250 30 305 44 380 22 400H70Z"
                            fill="white"
                            opacity="0.35"
                        />
                        <path
                            d="M70 0H50C22 50 64 95 44 155S18 265 42 320 52 385 36 400H70Z"
                            fill="white"
                        />
                    </svg>
                </section>

                {/* ===== Panel form ===== */}
                <section className="flex flex-1 flex-col justify-center px-6 pt-2 pb-10 sm:px-12 md:w-1/2 md:px-14 md:py-16">
                    {title && (
                        <h2 className="text-center text-xl font-semibold text-slate-800 md:text-2xl">
                            {title}
                        </h2>
                    )}
                    {description && (
                        <p className="mt-1 mb-8 text-center text-sm text-slate-500">
                            {description}
                        </p>
                    )}
                    {children}
                </section>
            </div>
        </div>
    );
}