import { Link } from '@inertiajs/react';
import {
    Building2,
    CalendarClock,
    CalendarDays,
    ClipboardCheck,
    Database,
    FileText,
    History,
    LayoutGrid,
    MapPin,
    PencilLine,
    Settings,
    Users,
} from 'lucide-react';
import { NavGroups } from '@/components/nav-groups';
import type { NavEntry } from '@/components/nav-groups';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';

const entries: NavEntry[] = [
    { title: 'Dashboard', href: '/admin', icon: LayoutGrid },
    {
        title: 'Data Master',
        icon: Database,
        items: [
            { title: 'Peserta', href: '/admin/peserta', icon: Users },
            { title: 'Jadwal Kerja', href: '/admin/jadwal', icon: CalendarClock },
            { title: 'Lokasi', href: '/admin/lokasi', icon: MapPin },
            { title: 'Divisi', href: '/admin/divisi', icon: Building2 },
        ],
    },
    {
        title: 'Absensi',
        icon: ClipboardCheck,
        items: [
            { title: 'Riwayat Absensi', href: '/admin/riwayat', icon: History },
            { title: 'Rekap Bulanan', href: '/admin/rekap', icon: CalendarDays },
            { title: 'Izin/Sakit', href: '/admin/izin', icon: FileText },
            { title: 'Absen Manual', href: '/admin/manual', icon: PencilLine },
        ],
    },
    { title: 'Pengaturan', href: '/admin/pengaturan', icon: Settings },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="sidebar">
            <SidebarHeader className="pb-6">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            className="h-auto justify-center py-4 hover:bg-transparent"
                        >
                            <Link href="/admin" prefetch>
                                <img
                                    src="/images/logo-ptsi.png"
                                    alt="PTSI"
                                    className="h-24 w-auto object-contain group-data-[collapsible=icon]:h-8"
                                />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavGroups entries={entries} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}