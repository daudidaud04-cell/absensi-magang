import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';

export default function SiamLayout({ title, children }: { title: string; children: ReactNode }) {
    return (
        <>
            <Head title={title} />
            <div className="mx-auto w-full max-w-[1400px] space-y-5 px-4 py-6 md:px-6 lg:px-8">{children}</div>
        </>
    );
}