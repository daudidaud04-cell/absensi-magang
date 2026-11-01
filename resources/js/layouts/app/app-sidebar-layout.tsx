import { usePage } from '@inertiajs/react';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import PesertaShell from '@/components/siam/PesertaShell';
import type { AppLayoutProps } from '@/types';

type Shared = { auth: { user: { role?: string } } };

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { auth } = usePage<Shared>().props;

    // Peserta magang: tampilan mobile dengan navigasi bawah, tanpa sidebar
    if (auth?.user?.role === 'magang') {
        return <PesertaShell>{children}</PesertaShell>;
    }

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="min-w-0 overflow-x-clip">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
        </AppShell>
    );
}