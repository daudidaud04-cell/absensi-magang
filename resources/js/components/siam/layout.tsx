import { Head, usePage } from '@inertiajs/react';
import { CheckCircle2, X, XCircle } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

type Flash = { success?: string | null; error?: string | null };
type Toast = { type: 'success' | 'error'; text: string };

export default function SiamLayout({ title, children }: { title: string; children: ReactNode }) {
    const flash = (usePage().props as { flash?: Flash }).flash;
    const [toast, setToast] = useState<Toast | null>(null);

    // Objek flash baru di setiap respons Inertia, jadi pesan yang sama tetap tampil lagi
    useEffect(() => {
        if (flash?.error) setToast({ type: 'error', text: flash.error });
        else if (flash?.success) setToast({ type: 'success', text: flash.success });
    }, [flash]);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), toast.type === 'error' ? 10000 : 6000);
        return () => clearTimeout(t);
    }, [toast]);

    return (
        <>
            <Head title={title} />

            {toast && (
                <div
                    role={toast.type === 'error' ? 'alert' : 'status'}
                    className={`fixed top-4 right-4 z-50 flex max-w-sm items-start gap-2 rounded-xl border bg-background px-4 py-3 text-sm shadow-lg ${
                        toast.type === 'error' ? 'border-red-500/50 text-red-600' : 'border-emerald-500/50 text-emerald-700'
                    }`}
                >
                    {toast.type === 'error' ? (
                        <XCircle className="mt-0.5 size-4 shrink-0" />
                    ) : (
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                    )}
                    <p className="flex-1">{toast.text}</p>
                    <button type="button" onClick={() => setToast(null)} aria-label="Tutup" className="shrink-0 opacity-70 hover:opacity-100">
                        <X className="size-4" />
                    </button>
                </div>
            )}

            <div className="mx-auto w-full max-w-[1400px] space-y-5 px-4 py-6 md:px-6 lg:px-8">{children}</div>
        </>
    );
}